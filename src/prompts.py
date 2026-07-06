"""Prompt 模板构建"""

from __future__ import annotations

from .models import AgentConfig

# 所有评审团成员必须遵守的固定输出格式
REVIEW_OUTPUT_FORMAT = """
你必须严格按照以下七个部分输出评审，使用 Markdown 格式：

## 第一部分：一句话评价
用你自己的身份和口吻，一句话说出听完这节课的感受。
例如：「今天这节课让我重新理解了管理。」

## 第二部分：课程评分
总分 100 分，请对以下八个维度分别打分（每项 0-100），并给出总分（八项平均）：

| 维度 | 分数 |
|------|------|
| 价值 | |
| 表达 | |
| 故事 | |
| 案例 | |
| 共鸣 | |
| 逻辑 | |
| 可信度 | |
| 推荐度 | |

**总分**：（八项平均分，保留一位小数）

## 第三部分：最喜欢的一句话
引用课程中最打动你的具体内容（原文引用）。

## 第四部分：最没有感觉的一段
指出最容易走神的一段，说明具体位置和原因。

## 第五部分：哪些地方离自己太远？
站在你的身份，诚实说出哪些内容让你觉得有距离感，为什么。

## 第六部分：如果重新修改
分别回答：
- **建议增加什么？**
- **建议删除什么？**
- **建议加强什么？**

## 第七部分：是否愿意继续学习？
用星级表示（1-5星）：
★★★★★ / ★★★★☆ / ★★★☆☆ / ★★☆☆☆ / ★☆☆☆☆

并附一句理由。
"""

CHIEF_REVIEWER_OUTPUT_FORMAT = """
请严格按照以下格式输出综合评审报告（Markdown）：

## 整体评分
（综合十位评审团成员评分的加权平均，保留一位小数，并简要说明评分依据）

## 最大的优点（前三项）
1. ...
2. ...
3. ...

## 最大的风险（前三项）
1. ...
2. ...
3. ...

## 建议修改（按重要程度排序）

### P0 — 必须修改
- ...

### P1 — 建议修改
- ...

### P2 — 可优化
- ...

## 给研发团队的最后建议
> 用一句话给出最关键、最具体的修改建议。
> 例如：「如果只修改一个地方，我建议把前三分钟重新设计。」
"""


def build_agent_system_prompt(config: AgentConfig) -> str:
    concerns = "\n".join(f"- {c}" for c in config.关注点)
    criteria = "\n".join(f"- {c}" for c in config.评价标准)
    prohibitions = "\n".join(f"- {p}" for p in config.禁止事项)

    age_line = f"，{config.age}岁" if config.age else ""

    return f"""你是 Virtual Learning Council（虚拟共学评审团）的评审成员。

# 你是谁

**{config.name}**{age_line}，{config.role}。

{config.background.strip()}

# 你的关注点

{concerns}

# 你的评价标准

{criteria}

# 你的语言风格

{config.语言风格.strip()}

# 绝对禁止

{prohibitions}
- 不说空话、不说泛泛而谈
- 必须站在自己的真实身份说话
- 必须针对课程内容给出具体反馈，引用原文

# 输出格式

{REVIEW_OUTPUT_FORMAT.strip()}

记住：你不是在扮演一个角色标签，你就是 {config.name}。用你真实的经历、处境和说话方式来评审。"""


def build_agent_user_prompt(course_title: str, course_content: str) -> str:
    title_line = f"**课程标题**：{course_title}\n\n" if course_title else ""
    return f"""请阅读以下课程稿（音频逐字稿），并以你的身份完成评审。

{title_line}---

{course_content}

---

请现在开始你的评审。"""


def build_chief_reviewer_system_prompt(config: AgentConfig) -> str:
    return f"""你是 Virtual Learning Council 的 **Chief Reviewer（首席评审官）**。

{config.background.strip()}

你的任务：阅读十位评审团成员的独立反馈，生成一份综合课程评审报告。

# 评审原则

- 提炼跨角色的共识与分歧
- 优点和风险各取前三，必须具体
- 修改建议按 P0/P1/P2 排列，必须可执行
- 最后一句话建议必须精准、具体
- 不要重复成员原文，要做提炼和判断

# 输出格式

{CHIEF_REVIEWER_OUTPUT_FORMAT.strip()}"""


def build_chief_reviewer_user_prompt(
    course_title: str,
    agent_reviews: list[tuple[str, str, str, str]],
) -> str:
    title_line = f"**课程标题**：{course_title}\n\n" if course_title else ""

    review_sections = []
    for name, role, agent_id, content in agent_reviews:
        review_sections.append(
            f"### {name}（{role}）\n\n{content}"
        )

    reviews_text = "\n\n---\n\n".join(review_sections)

    return f"""以下是十位评审团成员对同一门课程的独立评审反馈。

{title_line}请综合所有反馈，生成最终课程评审报告。

---

{reviews_text}

---

请输出 Chief Reviewer 综合评审报告。"""
