"""LLM 调用封装 — DeepSeek API"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI

# 始终从项目根目录加载 .env
_PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(_PROJECT_ROOT / ".env")


def get_client() -> AsyncOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "未找到 OPENAI_API_KEY，请在项目根目录 .env 中配置 DeepSeek API Key"
        )
    return AsyncOpenAI(
        api_key=api_key,
        base_url=os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com"),
    )


def get_model() -> str:
    return os.getenv("OPENAI_MODEL", "deepseek-chat")


def get_llm_info() -> dict:
    """返回当前 LLM 配置信息（不含密钥）"""
    return {
        "provider": "DeepSeek",
        "base_url": os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com"),
        "model": get_model(),
        "api_key_set": bool(os.getenv("OPENAI_API_KEY")),
    }


async def complete(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.7,
) -> str:
    client = get_client()
    response = await client.chat.completions.create(
        model=get_model(),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
    )
    return response.choices[0].message.content or ""
