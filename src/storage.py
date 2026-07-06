"""评审记录持久化存储"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent.parent / "data" / "reviews"


def _ensure_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _review_path(review_id: str) -> Path:
    return DATA_DIR / f"{review_id}.json"


def _markdown_path(review_id: str) -> Path:
    return DATA_DIR / f"{review_id}.md"


def _extract_overall_score(chief_content: str | None) -> float | None:
    if not chief_content:
        return None
    match = re.search(r"整体评分[^\d]*(\d+(?:\.\d+)?)", chief_content)
    return float(match.group(1)) if match else None


def _session_to_record(session: dict) -> dict:
    """将内存 session 转为可序列化记录"""
    record = {
        "id": session["id"],
        "status": session["status"],
        "course_title": session.get("course_title", ""),
        "course_content": session.get("course_content", ""),
        "created_at": session.get("created_at", datetime.now().isoformat()),
        "completed_at": session.get("completed_at"),
        "agent_reviews": session.get("agent_reviews", []),
        "chief_report": session.get("chief_report"),
        "error": session.get("error"),
        "word_count": len(session.get("course_content", "")),
    }
    chief = session.get("chief_report")
    if chief and isinstance(chief, dict):
        record["overall_score"] = _extract_overall_score(chief.get("content"))
    else:
        record["overall_score"] = session.get("overall_score")
    return record


def save_review(session: dict) -> None:
    """保存或更新评审记录"""
    _ensure_dir()
    record = _session_to_record(session)
    path = _review_path(session["id"])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)


def save_markdown(review_id: str, markdown: str) -> None:
    """保存 Markdown 格式完整报告"""
    _ensure_dir()
    path = _markdown_path(review_id)
    path.write_text(markdown, encoding="utf-8")


def load_review(review_id: str) -> Optional[dict]:
    """从磁盘加载单条评审记录"""
    path = _review_path(review_id)
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def list_reviews(limit: int = 50) -> list[dict]:
    """列出历史评审摘要，按时间倒序"""
    _ensure_dir()
    summaries = []
    for path in DATA_DIR.glob("*.json"):
        try:
            with open(path, encoding="utf-8") as f:
                record = json.load(f)
            summaries.append(
                {
                    "id": record["id"],
                    "course_title": record.get("course_title", ""),
                    "status": record.get("status", "unknown"),
                    "created_at": record.get("created_at", ""),
                    "completed_at": record.get("completed_at"),
                    "overall_score": record.get("overall_score"),
                    "word_count": record.get("word_count", 0),
                    "agent_count": len(record.get("agent_reviews", [])),
                }
            )
        except (json.JSONDecodeError, KeyError):
            continue

    summaries.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return summaries[:limit]


def load_all_reviews() -> dict[str, dict]:
    """启动时加载全部历史记录到内存"""
    _ensure_dir()
    store: dict[str, dict] = {}
    for path in DATA_DIR.glob("*.json"):
        try:
            with open(path, encoding="utf-8") as f:
                record = json.load(f)
            store[record["id"]] = record
        except (json.JSONDecodeError, KeyError):
            continue
    return store


def delete_review(review_id: str) -> bool:
    """删除评审记录"""
    json_path = _review_path(review_id)
    md_path = _markdown_path(review_id)
    deleted = False
    if json_path.exists():
        json_path.unlink()
        deleted = True
    if md_path.exists():
        md_path.unlink()
    return deleted
