"""Virtual Learning Council — FastAPI 后端"""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.agent_loader import load_council_agents, load_chief_reviewer
from src.council import run_council_review
from src.llm import get_llm_info
from src.storage import (
    delete_review,
    list_reviews,
    load_all_reviews,
    load_review,
    save_markdown,
    save_review,
)

app = FastAPI(title="Virtual Learning Council API")

def _cors_origins() -> list[str]:
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    extra = os.getenv("ALLOWED_ORIGINS", "")
    if extra:
        origins.extend(o.strip() for o in extra.split(",") if o.strip())
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 启动时从磁盘恢复历史记录
reviews_store: dict[str, dict] = load_all_reviews()
review_queues: dict[str, asyncio.Queue[tuple[str, dict]]] = {}
review_tasks: dict[str, asyncio.Task] = {}


class ReviewRequest(BaseModel):
    course_title: str = ""
    course_content: str


class AgentInfo(BaseModel):
    id: str
    name: str
    role: str
    age: int | None
    background: str
    avatar: str
    color: str
    quote: str
    concerns: list[str]


def _agent_avatar(agent_id: str) -> str:
    mapping = {
        "agent_01": "agent_01_zhang_jianguo.png",
        "agent_02": "agent_02_li_minghui.png",
        "agent_03": "agent_03_chen_yating.png",
        "agent_04": "agent_04_wang_lei.png",
        "agent_05": "agent_05_zhao_weidong.png",
        "agent_06": "agent_06_liu_fang.png",
        "agent_07": "agent_07_lin_xiaoyu.png",
        "agent_08": "agent_08_zhou_wenbin.png",
        "agent_09": "agent_09_sun_mingde.png",
        "agent_10": "agent_10_he_qingyuan.png",
    }
    return f"/avatars/{mapping.get(agent_id, 'chief_reviewer.png')}"


AGENT_META = {
    "agent_01": {"color": "#C9A84C", "quote": "值不值得全公司学？"},
    "agent_02": {"color": "#4A7CFF", "quote": "这个能不能落地？"},
    "agent_03": {"color": "#E8A0BF", "quote": "不同层级感受会不一样"},
    "agent_04": {"color": "#F5A623", "quote": "客户才不会管你这个"},
    "agent_05": {"color": "#2DD4BF", "quote": "这个对我有用/没用"},
    "agent_06": {"color": "#D4A574", "quote": "这跟我有什么关系？"},
    "agent_07": {"color": "#A78BFA", "quote": "愿不愿继续听？"},
    "agent_08": {"color": "#6EE7B7", "quote": "这个点值得深挖"},
    "agent_09": {"color": "#C45C6E", "quote": "此处恐有曲解"},
    "agent_10": {"color": "#38BDF8", "quote": "经典回答了今天的问题吗？"},
}


def _format_sse(event: str, data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


def _get_session(review_id: str) -> dict | None:
    if review_id in reviews_store:
        return reviews_store[review_id]
    record = load_review(review_id)
    if record:
        reviews_store[review_id] = record
        return record
    return None


def _persist(session: dict) -> None:
    save_review(session)


def _get_queue(review_id: str) -> asyncio.Queue[tuple[str, dict]]:
    if review_id not in review_queues:
        review_queues[review_id] = asyncio.Queue()
    return review_queues[review_id]


async def _run_review_background(review_id: str) -> None:
    session = reviews_store[review_id]
    queue = _get_queue(review_id)

    async def on_event(event: str, data: dict) -> None:
        # 增量持久化：每位 Agent 完成时立即保存
        if event == "agent_completed":
            session["agent_reviews"] = session.get("agent_reviews", [])
            session["agent_reviews"].append(
                {
                    "agent_id": data["agent_id"],
                    "agent_name": data["agent_name"],
                    "agent_role": data["agent_role"],
                    "content": data["content"],
                    "completed_at": data["completed_at"],
                }
            )
            _persist(session)
        await queue.put((event, data))

    try:
        session["status"] = "running"
        _persist(session)

        report = await run_council_review(
            session["course_content"],
            course_title=session["course_title"],
            verbose=False,
            on_event=on_event,
        )

        session["status"] = "completed"
        session["completed_at"] = datetime.now().isoformat()
        session["agent_reviews"] = [
            {
                "agent_id": r.agent_id,
                "agent_name": r.agent_name,
                "agent_role": r.agent_role,
                "content": r.content,
                "completed_at": r.completed_at.isoformat(),
            }
            for r in report.agent_reviews
        ]
        session["chief_report"] = {
            "content": report.chief_report.content,
            "completed_at": report.chief_report.completed_at.isoformat(),
        }

        # 保存 Markdown 完整报告
        save_markdown(review_id, report.to_markdown())
        _persist(session)

    except Exception as e:
        session["status"] = "error"
        session["error"] = str(e)
        _persist(session)
        await queue.put(("error", {"message": str(e)}))


def _ensure_review_task(review_id: str) -> None:
    session = reviews_store[review_id]
    if session["status"] in ("completed", "error"):
        return
    task = review_tasks.get(review_id)
    if task is None or task.done():
        review_tasks[review_id] = asyncio.create_task(
            _run_review_background(review_id)
        )


async def _replay_completed(session: dict) -> AsyncGenerator[str, None]:
    yield _format_sse(
        "review_started",
        {
            "course_title": session["course_title"],
            "agent_count": len(session.get("agent_reviews", [])),
            "replayed": True,
        },
    )
    for review in session.get("agent_reviews", []):
        yield _format_sse("agent_completed", review)
    if session.get("chief_report"):
        yield _format_sse("chief_completed", session["chief_report"])
    yield _format_sse(
        "review_completed",
        {"course_title": session["course_title"], "replayed": True},
    )


def _review_response(session: dict) -> dict:
    return {
        "id": session["id"],
        "status": session["status"],
        "course_title": session.get("course_title", ""),
        "course_content": session.get("course_content", ""),
        "created_at": session.get("created_at", ""),
        "completed_at": session.get("completed_at"),
        "overall_score": session.get("overall_score"),
        "word_count": session.get("word_count", 0),
        "agent_reviews": session.get("agent_reviews", []),
        "chief_report": session.get("chief_report"),
        "error": session.get("error"),
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "Virtual Learning Council",
        "stored_reviews": len(list_reviews()),
        "llm": get_llm_info(),
    }


@app.get("/api/agents")
async def list_agents():
    agents = load_council_agents()
    chief = load_chief_reviewer()
    result = []
    for a in agents:
        meta = AGENT_META.get(a.id, {})
        result.append(
            AgentInfo(
                id=a.id,
                name=a.name,
                role=a.role,
                age=a.age,
                background=a.background.strip().split("\n")[0],
                avatar=_agent_avatar(a.id),
                color=meta.get("color", "#C9A84C"),
                quote=meta.get("quote", ""),
                concerns=a.关注点,
            )
        )
    return {
        "agents": result,
        "chief_reviewer": {
            "id": chief.id,
            "name": chief.name,
            "role": chief.role,
            "avatar": "/avatars/chief_reviewer.png",
            "color": "#C9A84C",
        },
    }


@app.get("/api/reviews")
async def get_review_history(limit: int = 50):
    """获取历史评审记录列表"""
    return {"reviews": list_reviews(limit=limit)}


@app.post("/api/reviews")
async def create_review(req: ReviewRequest):
    if not req.course_content.strip():
        raise HTTPException(400, "课程稿内容不能为空")

    review_id = str(uuid.uuid4())
    session = {
        "id": review_id,
        "status": "pending",
        "course_title": req.course_title,
        "course_content": req.course_content,
        "created_at": datetime.now().isoformat(),
        "completed_at": None,
        "agent_reviews": [],
        "chief_report": None,
        "word_count": len(req.course_content),
    }
    reviews_store[review_id] = session
    _persist(session)
    _get_queue(review_id)
    return {"review_id": review_id}


@app.get("/api/reviews/{review_id}/stream")
async def stream_review(review_id: str):
    session = _get_session(review_id)
    if not session:
        raise HTTPException(404, "评审会话不存在")

    if session["status"] == "completed":
        return StreamingResponse(
            _replay_completed(session),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    if session["status"] == "error":
        async def error_stream():
            yield _format_sse("error", {"message": session.get("error", "未知错误")})

        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    _ensure_review_task(review_id)
    queue = _get_queue(review_id)

    async def event_generator() -> AsyncGenerator[str, None]:
        while True:
            try:
                event, data = await asyncio.wait_for(queue.get(), timeout=30)
            except asyncio.TimeoutError:
                yield _format_sse("ping", {"ts": datetime.now().isoformat()})
                continue

            yield _format_sse(event, data)

            if event in ("review_completed", "error"):
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/reviews/{review_id}")
async def get_review(review_id: str):
    session = _get_session(review_id)
    if not session:
        raise HTTPException(404, "评审会话不存在")
    return _review_response(session)


@app.delete("/api/reviews/{review_id}")
async def remove_review(review_id: str):
    if not delete_review(review_id):
        raise HTTPException(404, "评审记录不存在")
    reviews_store.pop(review_id, None)
    review_queues.pop(review_id, None)
    task = review_tasks.pop(review_id, None)
    if task and not task.done():
        task.cancel()
    return {"deleted": True}
