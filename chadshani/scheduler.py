"""
scheduler.py — runs generate_website.py on a fixed schedule + listens for Telegram trigger.
Run this from an external terminal (not inside a Claude Code session).

Usage:
    python scheduler.py
"""
import logging
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

import requests

# ── CONFIG ─────────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN = "8630512351:AAEgoHo7u22HVXS20xKc-7Q8uWzMYmqDD38"
TELEGRAM_CHAT_ID   = "-1003840479051"

# Times (HH:MM) to auto-run each day
SCHEDULED_TIMES = ["08:00", "12:00", "18:00", "22:00"]

# Telegram keywords that trigger an immediate run
TRIGGER_WORDS = ["עדכן", "חדשות", "update", "news"]

POLL_INTERVAL  = 30   # seconds between Telegram polls
# ──────────────────────────────────────────────────────────────────────────

ROOT           = Path(__file__).parent
GENERATE       = ROOT / "generate_website.py"

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


def run_pipeline():
    log.info("[PIPELINE_START]")
    result = subprocess.run(
        [sys.executable, str(GENERATE)],
        capture_output=True, text=True, encoding="utf-8"
    )
    if result.stdout:
        log.info(result.stdout.strip())
    if result.stderr:
        log.warning(result.stderr.strip())
    log.info("[PIPELINE_END] exit=%d", result.returncode)


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


def main():
    log.info("scheduler started — schedule: %s", ", ".join(SCHEDULED_TIMES))
    offset = 0
    last_run_minute = ""

    while True:
        now = datetime.now()
        current_minute = now.strftime("%H:%M")

        # ── Scheduled run ──
        if current_minute in SCHEDULED_TIMES and current_minute != last_run_minute:
            log.info("[SCHEDULED] %s", current_minute)
            run_pipeline()
            last_run_minute = current_minute

        # ── Telegram trigger ──
        updates, offset = get_updates(offset)
        for upd in updates:
            msg = upd.get("message") or upd.get("channel_post") or {}
            text = msg.get("text", "")
            chat_id = str(msg.get("chat", {}).get("id", ""))
            if chat_id == TELEGRAM_CHAT_ID and is_trigger(text):
                log.info("[TRIGGER] '%s'", text.strip())
                run_pipeline()
                break

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
