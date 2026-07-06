"""Virtual Learning Council 多智能体编排"""

from __future__ import annotations

import asyncio
import os
from typing import Awaitable, Callable, Optional

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from .agent_loader import load_chief_reviewer, load_council_agents
from .llm import complete
from .models import AgentConfig, AgentReview, ChiefReviewReport, CouncilReport
from .prompts import (
    build_agent_system_prompt,
    build_agent_user_prompt,
    build_chief_reviewer_system_prompt,
    build_chief_reviewer_user_prompt,
)

console = Console()

EventCallback = Callable[[str, dict], Awaitable[None]]


async def _emit(on_event: Optional[EventCallback], event: str, data: dict) -> None:
    if on_event:
        await on_event(event, data)


async def _run_single_agent(
    config: AgentConfig,
    course_title: str,
    course_content: str,
    on_event: Optional[EventCallback] = None,
) -> AgentReview:
    await _emit(
        on_event,
        "agent_started",
        {"agent_id": config.id, "agent_name": config.name, "agent_role": config.role},
    )

    system = build_agent_system_prompt(config)
    user = build_agent_user_prompt(course_title, course_content)
    content = await complete(system, user)

    review = AgentReview(
        agent_id=config.id,
        agent_name=config.name,
        agent_role=config.role,
        content=content,
    )

    await _emit(
        on_event,
        "agent_completed",
        {
            "agent_id": config.id,
            "agent_name": config.name,
            "agent_role": config.role,
            "content": content,
            "completed_at": review.completed_at.isoformat(),
        },
    )

    return review


async def _run_agents_parallel(
    agents: list[AgentConfig],
    course_title: str,
    course_content: str,
    max_concurrent: int,
    on_event: Optional[EventCallback] = None,
    progress: Optional[Progress] = None,
    task_id: Optional[int] = None,
) -> list[AgentReview]:
    semaphore = asyncio.Semaphore(max_concurrent)
    reviews: list[Optional[AgentReview]] = [None] * len(agents)

    async def run_with_limit(index: int, config: AgentConfig) -> None:
        async with semaphore:
            reviews[index] = await _run_single_agent(
                config, course_title, course_content, on_event
            )
            if progress and task_id is not None:
                progress.update(
                    task_id,
                    description=f"✓ {config.name}（{config.role}）已完成",
                )

    await asyncio.gather(*(run_with_limit(i, agent) for i, agent in enumerate(agents)))

    return [r for r in reviews if r is not None]


async def run_council_review(
    course_content: str,
    *,
    course_title: str = "",
    agent_ids: Optional[list[str]] = None,
    skip_chief: bool = False,
    max_concurrent: Optional[int] = None,
    verbose: bool = True,
    on_event: Optional[EventCallback] = None,
) -> CouncilReport:
    """启动 Virtual Learning Council 评审流程。"""
    all_agents = load_council_agents()

    if agent_ids:
        agents = [a for a in all_agents if a.id in agent_ids]
        if not agents:
            raise ValueError(f"未找到指定 agent: {agent_ids}")
    else:
        agents = all_agents

    concurrency = max_concurrent or int(os.getenv("MAX_CONCURRENT_AGENTS", "5"))

    await _emit(
        on_event,
        "review_started",
        {
            "course_title": course_title,
            "agent_count": len(agents),
            "agent_ids": [a.id for a in agents],
        },
    )

    if verbose:
        console.print("\n[bold cyan]Virtual Learning Council[/bold cyan]")
        console.print(f"启动 {len(agents)} 位评审团成员...\n")

    progress_ctx = (
        Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
            disable=not verbose,
        )
        if verbose
        else None
    )

    if progress_ctx:
        progress_ctx.__enter__()
        task = progress_ctx.add_task("评审进行中...", total=None)
    else:
        progress_ctx = None
        task = None

    try:
        agent_reviews = await _run_agents_parallel(
            agents,
            course_title,
            course_content,
            concurrency,
            on_event,
            progress_ctx,
            task,
        )

        if progress_ctx and task is not None:
            progress_ctx.update(task, description="全部评审团成员已完成")

        await _emit(on_event, "chief_started", {})

        chief_report: ChiefReviewReport
        if skip_chief:
            chief_report = ChiefReviewReport(content="（已跳过 Chief Reviewer）")
        else:
            if progress_ctx and task is not None:
                progress_ctx.update(task, description="Chief Reviewer 综合评审中...")

            chief_config = load_chief_reviewer()
            chief_system = build_chief_reviewer_system_prompt(chief_config)
            chief_user = build_chief_reviewer_user_prompt(
                course_title,
                [
                    (r.agent_name, r.agent_role, r.agent_id, r.content)
                    for r in agent_reviews
                ],
            )
            chief_content = await complete(chief_system, chief_user, temperature=0.5)
            chief_report = ChiefReviewReport(content=chief_content)

            if progress_ctx and task is not None:
                progress_ctx.update(task, description="✓ Chief Reviewer 综合评审完成")

        await _emit(
            on_event,
            "chief_completed",
            {
                "content": chief_report.content,
                "completed_at": chief_report.completed_at.isoformat(),
            },
        )

        report = CouncilReport(
            course_title=course_title,
            course_content=course_content,
            agent_reviews=agent_reviews,
            chief_report=chief_report,
        )

        await _emit(
            on_event,
            "review_completed",
            {
                "course_title": report.course_title,
                "created_at": report.created_at.isoformat(),
                "agent_reviews": [
                    {
                        "agent_id": r.agent_id,
                        "agent_name": r.agent_name,
                        "agent_role": r.agent_role,
                        "content": r.content,
                        "completed_at": r.completed_at.isoformat(),
                    }
                    for r in report.agent_reviews
                ],
                "chief_report": {
                    "content": report.chief_report.content,
                    "completed_at": report.chief_report.completed_at.isoformat(),
                },
            },
        )

        if verbose:
            console.print("\n[bold green]评审完成！[/bold green]\n")

        return report
    finally:
        if progress_ctx:
            progress_ctx.__exit__(None, None, None)
