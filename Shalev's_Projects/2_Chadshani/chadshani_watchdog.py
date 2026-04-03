#!/usr/bin/env python3
"""
Chadshani Watchdog — checks if the live site was updated recently.
Runs 1h15m after each scheduled update (08:00 and 20:00).
If the live site's generated_at is older than 13 hours → ntfy alert.
"""
import json
import sys
import urllib.request
from datetime import datetime, timezone

NTFY_TOPIC = "CloudeCode"
LIVE_JSON_URL = "https://shalevgigi-vks.github.io/Chadshani/data/latest.json"
STALE_THRESHOLD_HOURS = 13


def notify(title, message="", tags="rotating_light", priority=5):
    try:
        payload = json.dumps({
            "topic": NTFY_TOPIC,
            "title": title,
            "message": message,
            "tags": [tags],
            "priority": priority
        }, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            "https://ntfy.sh",
            data=payload,
            headers={"Content-Type": "application/json; charset=utf-8"},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"[NTFY] failed: {e}")


def main():
    print(f"[WATCHDOG] checking live site at {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    try:
        req = urllib.request.Request(
            LIVE_JSON_URL,
            headers={"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache, no-store"}
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            live = json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"[WATCHDOG] site unreachable: {e}")
        notify("חדשני — האתר לא נגיש 🚨", str(e)[:80])
        sys.exit(1)

    generated_at = live.get("generated_at", "")
    if not generated_at:
        notify("חדשני — generated_at חסר 🚨", "live JSON missing generated_at field")
        sys.exit(1)

    # Parse timestamp — format: "2026-04-03 06:44" (no timezone, treat as local)
    try:
        ts = datetime.strptime(generated_at, "%Y-%m-%d %H:%M")
        now = datetime.now()
        age_hours = (now - ts).total_seconds() / 3600
    except Exception as e:
        print(f"[WATCHDOG] cannot parse generated_at={generated_at!r}: {e}")
        notify("חדשני — שגיאת watchdog ⚠️", f"cannot parse: {generated_at}", tags="warning", priority=4)
        sys.exit(1)

    print(f"[WATCHDOG] generated_at={generated_at!r}  age={age_hours:.1f}h  threshold={STALE_THRESHOLD_HOURS}h")

    if age_hours > STALE_THRESHOLD_HOURS:
        notify(
            "חדשני — האתר לא עודכן 🚨",
            f"עדכון אחרון לפני {age_hours:.0f} שעות ({generated_at})"
        )
        print(f"[WATCHDOG] ALERT sent — site is {age_hours:.1f}h old")
        sys.exit(1)

    print("[WATCHDOG] OK — site is fresh")


if __name__ == "__main__":
    main()
