#!/usr/bin/env python3
"""Virtual Learning Council CLI"""

from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from rich.console import Console

from src.council import run_council_review

load_dotenv()
console = Console()


def read_course(path: Path) -> str:
    if not path.exists():
        console.print(f"[red]文件不存在：{path}[/red]")
        sys.exit(1)
    return path.read_text(encoding="utf-8").strip()


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Virtual Learning Council（虚拟共学评审团）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例：
  python main.py examples/sample_course.txt
  python main.py course.txt --title "论语与管理"
  python main.py course.txt --agents agent_04,agent_06 --output report.md
        """,
    )
    parser.add_argument("course_file", type=Path, help="课程稿文件路径（音频逐字稿）")
    parser.add_argument("--title", "-t", default="", help="课程标题")
    parser.add_argument(
        "--agents",
        default="",
        help="指定评审团成员 ID，逗号分隔（默认全部10位）",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=None,
        help="输出报告路径（默认 outputs/ 目录）",
    )
    parser.add_argument(
        "--skip-chief",
        action="store_true",
        help="跳过 Chief Reviewer 综合评审",
    )
    parser.add_argument(
        "--concurrent",
        type=int,
        default=None,
        help="最大并发评审数",
    )
    parser.add_argument("--quiet", "-q", action="store_true", help="静默模式")

    args = parser.parse_args()

    course_content = read_course(args.course_file)
    if not course_content:
        console.print("[red]课程稿内容为空[/red]")
        sys.exit(1)

    agent_ids = [a.strip() for a in args.agents.split(",") if a.strip()] or None

    report = await run_council_review(
        course_content,
        course_title=args.title,
        agent_ids=agent_ids,
        skip_chief=args.skip_chief,
        max_concurrent=args.concurrent,
        verbose=not args.quiet,
    )

    markdown = report.to_markdown()

    if args.output:
        output_path = args.output
    else:
        output_dir = Path("outputs")
        output_dir.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        title_slug = args.title.replace(" ", "_")[:30] if args.title else "course"
        output_path = output_dir / f"review_{title_slug}_{timestamp}.md"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(markdown, encoding="utf-8")

    if not args.quiet:
        console.print(f"报告已保存：[bold]{output_path}[/bold]")


if __name__ == "__main__":
    asyncio.run(main())
