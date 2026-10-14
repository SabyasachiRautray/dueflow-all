"""Thin wrapper around the NVIDIA Build (OpenAI-compatible) endpoint.

If NVIDIA_API_KEY / NVIDIA_MODEL are missing, or the call fails, callers fall back
to deterministic behaviour. The agent must never depend on the LLM being up.
"""
import os

from dotenv import load_dotenv

load_dotenv()


class LLMUnavailable(Exception):
    pass


def chat(prompt: str, max_tokens: int = 500):
    """Return (text, tokens_used). Raises LLMUnavailable on any problem."""
    key, model = os.getenv("NVIDIA_API_KEY"), os.getenv("NVIDIA_MODEL")
    if not key or not model:
        raise LLMUnavailable("NVIDIA_API_KEY / NVIDIA_MODEL not configured")
    try:
        from openai import OpenAI

        client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=key,
                        timeout=12, max_retries=0)
        resp = client.chat.completions.create(
            model=model, messages=[{"role": "user", "content": prompt}],
            temperature=0.1, max_tokens=max_tokens,
        )
        text = resp.choices[0].message.content or ""
        tokens = getattr(getattr(resp, "usage", None), "total_tokens", 0) or 0
        return text, tokens
    except Exception as exc:  # network, auth, quota, bad model id ...
        raise LLMUnavailable(str(exc)) from exc