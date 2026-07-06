"""LLM 调用封装"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()


def get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com"),
    )


def get_model() -> str:
    return os.getenv("OPENAI_MODEL", "deepseek-chat")


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
