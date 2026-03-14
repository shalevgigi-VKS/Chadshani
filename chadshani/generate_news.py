"""
generate_news.py — calls Gemini API (with Google Search grounding) to produce
the 10-section news desk. Writes result to temp_news.txt.

Exit 0 = success, Exit 1 = failure.

Env vars required:
    GEMINI_API_KEY       — Gemini API key (from Google AI Studio)
    (optional, for local) — TELEGRAM_* loaded from .env

Usage:
    python generate_news.py
"""
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT        = Path(__file__).parent
ENV_FILE    = ROOT / ".env"
PROMPT_FILE = ROOT / "chadshani_prompt.txt"
TEMP_NEWS   = ROOT / "temp_news.txt"
TZ_IL       = ZoneInfo("Asia/Jerusalem")
MIN_LENGTH  = 500


# ── Minimal .env loader (for local runs only) ──────────────────────────────

def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


# ── Timestamp injection ────────────────────────────────────────────────────

def get_timestamp() -> str:
    now = datetime.now(TZ_IL)
    return now.strftime("%d.%m.%Y | %H:%M | שעון ישראל")


def ensure_timestamp(text: str) -> str:
    if re.match(r"\d{2}\.\d{2}\.\d{4}", text.strip()[:20]):
        return text
    return f"{get_timestamp()}\n\n{text}"


# ── Gemini API call with Google Search grounding ───────────────────────────

def run_gemini(prompt: str) -> tuple[bool, str]:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        msg = "[ERROR] GEMINI_API_KEY not set — add it to GitHub Secrets or .env"
        print(msg, file=sys.stderr)
        return False, msg

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        msg = "[ERROR] google-genai not installed — run: pip install google-genai"
        print(msg, file=sys.stderr)
        return False, msg

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                temperature=0.3,
            ),
        )

        text = response.text or ""

        if len(text) < MIN_LENGTH:
            msg = f"[ERROR] Gemini output too short ({len(text)} chars): {text[:200]}"
            print(msg, file=sys.stderr)
            return False, msg

        return True, text

    except Exception as e:
        msg = f"[ERROR] Gemini API error: {e}"
        print(msg, file=sys.stderr)
        return False, msg


# ── Main ───────────────────────────────────────────────────────────────────

def main() -> int:
    load_env(ENV_FILE)

    if not PROMPT_FILE.exists():
        print(f"[ERROR] Prompt file not found: {PROMPT_FILE}", file=sys.stderr)
        return 1

    prompt = PROMPT_FILE.read_text(encoding="utf-8")
    print("[STEP_1] Calling Gemini API with Google Search grounding...")

    ok, output = run_gemini(prompt)

    if not ok:
        TEMP_NEWS.write_text(output, encoding="utf-8")
        return 1

    output = ensure_timestamp(output)
    TEMP_NEWS.write_text(output, encoding="utf-8")

    print(f"[STEP_1_COMPLETE] {len(output)} chars, {len(output.splitlines())} lines")
    return 0


if __name__ == "__main__":
    sys.exit(main())
