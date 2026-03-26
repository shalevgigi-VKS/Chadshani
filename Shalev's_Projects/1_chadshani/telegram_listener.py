"""
Chadshani Telegram Listener
Polls for "תעדכן אותי" / "עדכון" commands → triggers GitHub Actions workflow.
Run: python telegram_listener.py

Required env vars:
  TELEGRAM_BOT_TOKEN  — bot token from @BotFather
  TELEGRAM_CHAT_ID    — your chat/user ID
  GITHUB_TOKEN        — GitHub Personal Access Token (repo scope)
"""

import os
import time
import requests

BOT_TOKEN  = os.environ["TELEGRAM_BOT_TOKEN"]
CHAT_ID    = os.environ["TELEGRAM_CHAT_ID"]
GH_TOKEN   = os.environ["GITHUB_TOKEN"]
GH_REPO    = "shalevgigi-VKS/Chadshani"
WORKFLOW   = "chadshani-2.yml"
TRIGGER_WORDS = {"תעדכן אותי", "עדכון"}

last_update_id = 0

def tg_get(updates_offset):
    try:
        r = requests.get(
            f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates",
            params={"offset": updates_offset, "timeout": 20},
            timeout=25,
        )
        return r.json().get("result", [])
    except Exception:
        return []

def tg_send(text):
    try:
        requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            json={"chat_id": CHAT_ID, "text": text},
            timeout=10,
        )
    except Exception:
        pass

def gh_trigger():
    r = requests.post(
        f"https://api.github.com/repos/{GH_REPO}/actions/workflows/{WORKFLOW}/dispatches",
        json={"ref": "master"},
        headers={
            "Authorization": f"token {GH_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
        },
        timeout=15,
    )
    return r.status_code == 204

print("[חדשני-bot] מאזין לפקודות טלגרם...")

while True:
    try:
        updates = tg_get(last_update_id + 1)
        for u in updates:
            last_update_id = u["update_id"]
            msg  = u.get("message", {})
            text = msg.get("text", "").strip()
            if any(word in text for word in TRIGGER_WORDS):
                print(f"[TRG] '{text}'")
                if gh_trigger():
                    tg_send("🔄 חדשני מתעדכן... תקבל הודעה כשהאתר מוכן לצפייה")
                else:
                    tg_send("⚠️ שגיאה בהפעלת העדכון — בדוק GITHUB_TOKEN")
    except Exception as e:
        print(f"[ERR] {e}")
    time.sleep(10)
