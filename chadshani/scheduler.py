"""
scheduler.py — runs the 2-stage news pipeline on a fixed schedule + Telegram trigger.
Run from an external terminal (not inside a Claude Code session).

Usage:
    python scheduler.py
"""
import logging
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

# ── Minimal .env loader ────────────────────────────────────────────────────

ROOT     = Path(__file__).parent
ENV_FILE = ROOT / ".env"
TZ_IL    = ZoneInfo("Asia/Jerusalem")


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


load_env(ENV_FILE)

# ── CONFIG ─────────────────────────────────────────────────────────────────

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID   = os.environ.get("TELEGRAM_CHAT_ID", "")

# Israel time (HH:MM) — machine clock must be set to Asia/Jerusalem
SCHEDULED_TIMES = ["07:00", "14:30", "21:00"]

# Telegram keywords that trigger an immediate run
TRIGGER_WORDS = ["עדכן", "עדכון", "תעדכן אותי", "חדשות", "update", "news"]

POLL_INTERVAL        = 30   # seconds between Telegram polls
MIN_TRIGGER_INTERVAL = 300  # 5-minute cooldown between manual triggers

# ──────────────────────────────────────────────────────────────────────────

GENERATE_NEWS    = ROOT / "generate_news.py"
GENERATE_WEBSITE = ROOT / "generate_website.py"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.FileHandler(ROOT / "scheduler.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)


# ── Pipeline ───────────────────────────────────────────────────────────────

def run_pipeline() -> None:
    log.info("[PIPELINE_START]")

    # Stage 1: generate news via Gemini
    r1 = subprocess.run(
        [sys.executable, str(GENERATE_NEWS)],
        capture_output=True, text=True, encoding="utf-8", timeout=240,
    )
    if r1.stdout:
        log.info(r1.stdout.strip())
    if r1.stderr:
        log.warning(r1.stderr.strip())

    if r1.returncode != 0:
        log.error("[PIPELINE_ABORT] generate_news.py failed (exit %d)", r1.returncode)
        return

    # Stage 2: build website + send Telegram
    r2 = subprocess.run(
        [sys.executable, str(GENERATE_WEBSITE)],
        capture_output=True, text=True, encoding="utf-8", timeout=120,
    )
    if r2.stdout:
        log.info(r2.stdout.strip())
    if r2.stderr:
        log.warning(r2.stderr.strip())

    log.info("[PIPELINE_END] exit=%d", r2.returncode)


# ── Telegram polling ───────────────────────────────────────────────────────

def get_updates(offset: int) -> tuple[list, int]:
    try:
        r = requests.get(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates",
            params={"offset": offset, "timeout": 25},
            timeout=30,
        )
        data = r.json()
        if not data.get("ok"):
            return [], offset
        updates = data["result"]
        new_offset = updates[-1]["update_id"] + 1 if updates else offset
        return updates, new_offset
    except Exception as e:
        log.warning("getUpdates error: %s", e)
        return [], offset


def is_trigger(text: str) -> bool:
    t = text.strip().lower()
    return any(w in t for w in TRIGGER_WORDS)


# ── Main loop ──────────────────────────────────────────────────────────────

def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        log.error("TELEGRAM_BOT_TOKEN not set — check .env file")
        sys.exit(1)

    log.info("scheduler started — schedule: %s (Israel time)", ", ".join(SCHEDULED_TIMES))
    offset = 0
    last_run_minute   = ""
    last_trigger_time = 0.0

    while True:
        now_il         = datetime.now(TZ_IL)
        current_minute = now_il.strftime("%H:%M")

        # ── Scheduled run ──
        if current_minute in SCHEDULED_TIMES and current_minute != last_run_minute:
            log.info("[SCHEDULED] %s", current_minute)
            run_pipeline()
            last_run_minute = current_minute

        # ── Telegram trigger ──
        updates, offset = get_updates(offset)
        for upd in updates:
            msg     = upd.get("message") or upd.get("channel_post") or {}
            text    = msg.get("text", "")
            chat_id = str(msg.get("chat", {}).get("id", ""))

            if chat_id == TELEGRAM_CHAT_ID and is_trigger(text):
                elapsed = time.time() - last_trigger_time
                if elapsed < MIN_TRIGGER_INTERVAL:
                    log.info("[TRIGGER_COOLDOWN] %.0fs remaining", MIN_TRIGGER_INTERVAL - elapsed)
                else:
                    log.info("[TRIGGER] '%s'", text.strip())
                    last_trigger_time = time.time()
                    run_pipeline()
                break

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
