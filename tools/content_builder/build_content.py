import hashlib
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import requests


BASE_DIR = Path(__file__).resolve().parent
INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"
PROMPTS_DIR = BASE_DIR / "prompts"

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:1.5b"

DEFAULT_QUESTION_COUNT = 5
MAX_FRAGMENT_CHARS = 2200


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def split_text_into_fragments(text: str, max_chars: int = MAX_FRAGMENT_CHARS) -> list[str]:
    clean = re.sub(r"\s+", " ", text).strip()

    if not clean:
        return []

    if len(clean) <= max_chars:
        return [clean]

    sentences = re.split(r"(?<=[.!?])\s+", clean)

    fragments: list[str] = []
    current = ""

    for sentence in sentences:
        sentence = sentence.strip()

        if not sentence:
            continue

        if len(current) + len(sentence) + 1 <= max_chars:
            current = f"{current} {sentence}".strip()
        else:
            if current:
                fragments.append(current)

            if len(sentence) > max_chars:
                fragments.extend(split_long_text(sentence, max_chars))
                current = ""
            else:
                current = sentence

    if current:
        fragments.append(current)

    return fragments


def split_long_text(text: str, max_chars: int) -> list[str]:
    words = text.split()
    fragments: list[str] = []
    current_words: list[str] = []
    current_length = 0

    for word in words:
        extra = len(word) + 1

        if current_length + extra <= max_chars:
            current_words.append(word)
            current_length += extra
        else:
            if current_words:
                fragments.append(" ".join(current_words))
            current_words = [word]
            current_length = len(word)

    if current_words:
        fragments.append(" ".join(current_words))

    return fragments


def render_prompt(template: str, values: dict[str, Any]) -> str:
    result = template

    for key, value in values.items():
        result = result.replace(f"{{{{{key}}}}}", str(value))

    return result


def clean_json_response(response_text: str) -> str:
    cleaned = response_text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "", 1).strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```", "", 1).strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    return cleaned


def call_ollama(prompt: str) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "top_p": 0.8,
            "num_ctx": 4096,
        },
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=240,
    )
    response.raise_for_status()

    data = response.json()
    raw_response = data.get("response", "").strip()

    debug_dir = OUTPUT_DIR / "debug"
    debug_dir.mkdir(parents=True, exist_ok=True)

    debug_file = debug_dir / f"ollama_raw_{datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')}.txt"
    debug_file.write_text(raw_response, encoding="utf-8")

    return raw_response


def parse_json_from_ollama(raw: str, context: str) -> dict[str, Any]:
    cleaned = clean_json_response(raw)

    try:
        return json.loads(cleaned)
    except json.JSO