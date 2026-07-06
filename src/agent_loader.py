"""Agent 配置加载"""

from __future__ import annotations

from pathlib import Path

import yaml

from .models import AgentConfig

AGENTS_DIR = Path(__file__).parent.parent / "agents"

# V1 评审团固定顺序
COUNCIL_AGENT_FILES = [
    "agent_01_zhang_jianguo.yaml",
    "agent_02_li_minghui.yaml",
    "agent_03_chen_yating.yaml",
    "agent_04_wang_lei.yaml",
    "agent_05_zhao_weidong.yaml",
    "agent_06_liu_fang.yaml",
    "agent_07_lin_xiaoyu.yaml",
    "agent_08_zhou_wenbin.yaml",
    "agent_09_sun_mingde.yaml",
    "agent_10_he_qingyuan.yaml",
]

CHIEF_REVIEWER_FILE = "chief_reviewer.yaml"


def load_agent_config(filename: str) -> AgentConfig:
    path = AGENTS_DIR / filename
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return AgentConfig(**data)


def load_council_agents() -> list[AgentConfig]:
    return [load_agent_config(f) for f in COUNCIL_AGENT_FILES]


def load_chief_reviewer() -> AgentConfig:
    return load_agent_config(CHIEF_REVIEWER_FILE)
