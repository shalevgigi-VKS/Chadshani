#!/usr/bin/env python3
"""
Chadshani Telegram Bot — on-demand update trigger.
Send "תעדכן אותי" / "עדכן" / "update" → runs chadshani_auto.py.
Runs at Windows startup via Task Scheduler (pythonw.exe, no console).
"""
import json
import os
import subprocess
import sys
import threading
import time
import urllib.request

# ── Config ────────────────────────────────────────────────────────────────────
TOKEN   = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = int(os.environ.get("TG_CHAT_ID", "-1003840479051"))

if not TOKEN:
    print("ERROR: TELEGRAM_BOT_TOKEN env var not set")
    sys.exit(1)

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
AUTO_SCRIPT = os.path.join(SCRIPT_DIR, "chadshani_auto.py")
BASE_URL    = f"https://api.telegram.org/bot{TOKEN}"

TRIGGERS = ["עדכן", "תעדכן", "update", "עדכון"]

_running = False
_lock    = threading.Lock()

# ── Telegram helpers ──────────────────────────────────────────────────────────

def _tg(method: str, **params):
    url  = f"{BASE_URL}/{method}"
    data = json.dumps(params).encode("utf-8")
    req  = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"[TG] {method} error: {e}")
        return None


def send(chat_id: int, text: str):
    _tg("sendMessage", chat_id=chat_id, text=text)


def is_trigger(text: str) -> bool:
    if not text:
        return False
    t = text.strip().lower()
    return any(k in t for k in TRIGGERS)

# ── Update runner (threaded) ──────────────────────────────────────────────────

def run_update(chat_id: int):
    global _running
    with _lock:
        if _running:
            send(chat_id, "⏳ עדכון כבר רץ — נסה שוב עוד כמה דקות")
            return
        _running = True

    send(chat_id, "מעדכן... ⏳")
    try:
        result = subprocess.run(
            [sys.executable, AUTO_SCRIPT],
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=360,
            cwd=SCRIPT_DIR,
        )
        if result.returncode == 0:
            send(chat_id, "חדשני עודכן בהצלחה ✅")
        elif result.returncode == 2:
            send(chat_id, "⏭ דולג — Gemini לא זמין")
        else:
            send(chat_id, f"⚠️ שגיאה (exit {result.returncode})")
    except subprocess.TimeoutExpired:
        send(chat_id, "⚠️ timeout — הריצה נמשכת יותר מ-6 דקות")
    except Exception as e:
        send(chat_id, f"⚠️ {e}")
    finally:
        _running = False

# ── Main polling loop ─────────────────────────────────────────────────────────

def main():
    print(f"[BOT] Starting — chat_id={CHAT_ID}")
    offset = None

    while True:
        params = {"timeout": 30, "allowed_updates": ["message"]}
        if offset is not None:
            params["offset"] = offset

        resp = _tg("getUpdates", **params)
        if not resp or not resp.get("ok"):
            # 409 = another instance polling — wait for it to expire
            time.sleep(35)
            continue

        for update in resp.get("result", []):
            offset = update["update_id"] + 1
            msg     = update.get("message", {})
            text    = msg.get("text", "")
            chat_id = msg.get("chat", {}).get("id", CHAT_ID)

            if is_trigger(text):
                threading.Thread(
                    target=run_update, args=(chat_id,), daemon=True
                ).start()


if __name__ == "__main__":
    main()
