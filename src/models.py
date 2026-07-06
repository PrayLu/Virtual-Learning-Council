"""Virtual Learning Council — 数据模型"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AgentConfig(BaseModel):
    id: str
    name: str
    role: str
    age: Optional[int] = None
    background: str
    关注点: list[str] = Field(alias="关注点")
    评价标准: list[str] = Field(alias="评价标准")
    语言风格: str = Field(alias="语言风格")
    禁止事项: list[str] = Field(alias="禁止事项")

    model_config = {"populate_by_name": True}


class AgentReview(BaseModel):
    agent_id: str
    agent_name: str
    agent_role: str
    content: str
    completed_at: datetime = Field(default_factory=datetime.now)


class ChiefReviewReport(BaseModel):
    content: str
    completed_at: datetime = Field(default_factory=datetime.now)


class CouncilReport(BaseModel):
    course_title: str
    course_content: str
    agent_reviews: list[AgentReview]
    chief_report: ChiefReviewReport
    created_at: datetime = Field(default_factory=datetime.now)

    def to_markdown(self) -> str:
        lines = [
            "# Virtual Learning Council 课程评审报告",
            "",
            f"**生成时间**：{self.created_at.strftime('%Y-%m-%d %H:%M')}",
            "",
            "---",
            "",
            "## 课程原文",
            "",
            self.course_content,
            "",
            "---",
            "",
            "## 评审团成员反馈",
            "",
        ]

        for review in self.agent_reviews:
            lines.extend(
                [
                    f"### {review.agent_name}（{review.agent_role}）",
                    "",
                    review.content,
                    "",
                    "---",
                    "",
                ]
            )

        lines.extend(
            [
                "## Chief Reviewer 综合评审",
                "",
                self.chief_report.content,
                "",
            ]
        )

        return "\n".join(lines)
