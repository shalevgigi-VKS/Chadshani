#!/usr/bin/env python3
"""
Chadshani Auto-Update Script
Runs generate_json.py then git commit + push to deploy GitHub Pages.
Called by Windows Task Scheduler (chadshani-0645, chadshani-1845).
"""
import subprocess
import sys
import os
import json
import urllib.request
import shutil
from datetime import datetime

# Force UTF-8 stdout/stderr for Hebrew + emoji on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

NTFY_TOPIC = "CloudeCode"
BUDGET_ILS = 25.0  # Increased to cover current bill (₪18.61) — future runs must be ₪0.00
COST_LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "cost_log.json")


def read_cost_log():
    if os.path.exists(COST_LOG):
        with open(COST_LOG, encoding="utf-8") as f:
            return json.load(f)
    return {"runs": [], "total_usd": 0.0, "total_ils": 0.0}


def monthly_cost_ils():
    """Sum cost_ils for current calendar month only (matches Google billing reset)."""
    log = read_cost_log()
    month = datetime.utcnow().strftime("%Y-%m")
    return sum(r.get("cost_ils", 0.0) for r in log.get("runs", [])
               if r.get("ts", "").startswith(month))


def daily_cost_ils():
    """Sum cost_ils for current UTC calendar day."""
    log = read_cost_log()
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return sum(r.get("cost_ils", 0.0) for r in log.get("runs", [])
               if r.get("ts", "").startswith(today))


def notify(title, message, tags="white_check_mark", priority=3):
    """שליחת התראה דרך ntfy.sh JSON API — תמיכה מלאה בעברית."""
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
        print(f"[NTFY] שנשלחה התראה: {title}")
    except Exception as e:
        print(f"[NTFY] שגיאה בשליחת התראה: {e}")

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.abspath(os.path.join(PROJECT_DIR, "..", ".."))
DATA_REL     = os.path.join("Shalev's_Projects", "2_Chadshani", "data", "latest.json")
INDEX_REL     = os.path.join("Shalev's_Projects", "2_Chadshani", "index.html")
INDEX_REAL    = os.path.join(PROJECT_DIR, "index_template.html")
INDEX_MAINT   = os.path.join(PROJECT_DIR, "index_maintenance.html")


def run(cmd, cwd=None, env=None):
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd, env=env)
    if result.stdout:
        print(result.stdout.strip())
    if result.returncode != 0:
        print(f"[ERROR] {' '.join(str(c) for c in cmd)}")
        if result.stderr:
            print(result.stderr.strip())
        return False
    return True


def verify_deployment(expected_ts, timeout=120):
    """Wait for GitHub Pages JSON to reflect the new generated_at timestamp."""
    json_url = "https://shalevgigi-vks.github.io/Chadshani/data/latest.json"
    start = datetime.now()
    print(f"[CHECK] Polling live JSON at {json_url}...")
    import time
    while (datetime.now() - start).seconds < timeout:
        try:
            req = urllib.request.Request(
                json_url,
                headers={"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache, no-store"}
            )
            with urllib.request.urlopen(req, timeout=10) as r:
                live = json.loads(r.read().decode("utf-8"))
                live_ts = live.get("generated_at", "")
                if live_ts == expected_ts:
                    print(f"[MATCH] Live JSON updated! generated_at={live_ts}")
                    return True
                print(f"[WAIT] live={live_ts!r} expected={expected_ts!r} ({(datetime.now() - start).seconds}s)")
        except Exception as e:
            print(f"[RETRY] {e}")
        time.sleep(15)
    return False


def main():
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"[START] chadshani_auto — {now}")

    # Budget check — monthly only (resets on 1st, matches Google billing)
    month_ils = monthly_cost_ils()
    pct = month_ils / BUDGET_ILS * 100
    print(f"[BUDGET] this month: ₪{month_ils:.2f} / ₪{BUDGET_ILS:.0f} ({pct:.1f}%)")
    if month_ils >= BUDGET_ILS:
        msg = f"תקציב חודשי מוצה: ₪{month_ils:.2f} / ₪{BUDGET_ILS:.0f} — עדכון הופסק"
        print(f"[BUDGET] EXCEEDED — {msg}")
        notify("חדשני — תקציב מוצה ⛔", "", tags="x")
        sys.exit(1)
    if month_ils >= BUDGET_ILS * 0.9:
        print(f"[BUDGET] WARNING: {pct:.0f}% used")
        notify("חדשני — תקציב 90% ⚠️", f"₪{month_ils:.2f} / ₪{BUDGET_ILS:.0f} השתמשו החודש", tags="x", priority=4)

    # Daily cost spike check
    day_ils = daily_cost_ils()
    if day_ils > 1.5:
        notify("חדשני — עלות יומית חריגה 💸", f"₪{day_ils:.2f} היום", tags="x", priority=4)

    # Step 1: (DISCONTINUED) Site remains live during update (v3.2.11 LOCKDOWN)
    print("[INFO] skipped maintenance mode switch — site stays live during data fetch")

    # Step 2: Generate JSON (sets GEMINI_API_KEY from environment)
    generate_script = os.path.join(PROJECT_DIR, "generate_json.py")
    result = subprocess.run(
        [sys.executable, generate_script],
        cwd=PROJECT_DIR
    )
    if result.returncode != 0:
        print("[ERROR] generate_json.py failed — aborting")
        notify("חדשני — שגיאה ביצירת נתונים ⚠️", "", tags="x")
        sys.exit(1)

    # Step 2: Validate generated data before committing
    data_path = os.path.join(REPO_DIR, DATA_REL)
    PLACEHOLDERS = ("לא זמין", "$...", None, "", "אין חדשות חדשות מהשבוע האחרון.",
                    "עדכון ידוע: לא זמין", "לא זמין.", "אין עדכון")
    try:
        with open(data_path, encoding="utf-8") as f:
            data = json.load(f)
        issues = []
        if not data.get("generated_at"):
            issues.append("generated_at missing")
        headline = data.get("section_1_situation", {}).get("headline", "")
        if not headline or headline in PLACEHOLDERS:
            issues.append("headline missing or placeholder")
        alert_value = data.get("section_1_situation", {}).get("alert", {}).get("value", "")
        if not alert_value or alert_value in PLACEHOLDERS or alert_value == "N/A":
            issues.append(f"alert.value is invalid: {alert_value!r}")
        markets = data.get("markets", {})
        for key in ("sp500", "nasdaq", "vix"):
            if key not in markets:
                issues.append(f"markets.{key} missing")
        if len(data.get("section_2_news", [])) < 4:
            issues.append(f"section_2_news has {len(data.get('section_2_news', []))} items (need 4)")
        for item in data.get("section_2_news", []):
            s = item.get("body", "") or item.get("summary", "")
            if not s or "אין חדשות" in s or s.strip() in PLACEHOLDERS:
                issues.append(f"section_2_news placeholder body: {s[:30]!r}")
            elif len(s) < 120:
                issues.append(f"section_2_news content too thin ({len(s)} chars) - rich analysis required")
        ai_section = data.get("section_7_ai", [])
        if len(ai_section) < 4:
            issues.append(f"section_7_ai has {len(ai_section)} items (need 4)")
        # Support both new `updates` array and legacy `update` string
        def _ai_no_news(item):
            updates = item.get("updates")
            if isinstance(updates, list):
                return all("אין חדשות" in (u or "") for u in updates)
            return "אין חדשות חדשות" in (item.get("update", "") or "")
        placeholder_ai = sum(1 for item in ai_section if _ai_no_news(item))
        if placeholder_ai >= 3:
            issues.append(f"section_7_ai: {placeholder_ai}/6 companies have no news (threshold: max 2)")
        if issues:
            print("[VALIDATE] FAIL:")
            for i in issues:
                print(f"  - {i}")
            notify("חדשני — ולידציה נכשלה ⚠️", issues[0], tags="x", priority=4)
            sys.exit(1)
        print(f"[VALIDATE] PASS — {len(data)} keys")
    except FileNotFoundError:
        print("[VALIDATE] ERROR: latest.json not found")
        notify("חדשני — latest.json חסר ⚠️", "", tags="x", priority=4)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"[VALIDATE] ERROR: JSON corrupt — {e}")
        notify("חדשני — JSON פגום ⚠️", str(e)[:80], tags="x", priority=4)
        sys.exit(1)
    except Exception as e:
        print(f"[VALIDATE] ERROR: {e}")
        notify("חדשני — שגיאת ולידציה ⚠️", str(e)[:80], tags="x", priority=4)
        sys.exit(1)

    # Step 3: Restore real site + stage data + index together
    dst_index = os.path.join(REPO_DIR, INDEX_REL)
    try:
        if os.path.abspath(INDEX_REAL) != os.path.abspath(dst_index):
            shutil.copy2(INDEX_REAL, dst_index)
    except Exception as e:
        print(f"[ERROR] Failed to copy index template: {e}")
        notify("חדשני — שגיאה בהעתקת template ⚠️", str(e)[:80], tags="x", priority=4)
        sys.exit(1)
    if not run(["git", "add", DATA_REL, INDEX_REL], cwd=REPO_DIR):
        notify("חדשני — git add נכשל ⚠️", "", tags="x", priority=4)
        sys.exit(1)

    # Step 4: Commit (skip if nothing changed)
    commit_result = subprocess.run(
        ["git", "commit", "-m", f"update {now}"],
        capture_output=True, text=True, cwd=REPO_DIR
    )
    if commit_result.returncode != 0:
        if "nothing to commit" in commit_result.stdout or "nothing to commit" in commit_result.stderr:
            print("[SKIP] Nothing changed — no commit needed")
            notify("חדשני — ללא שינויים ℹ️", "", priority=2)
            sys.exit(0)
        print(f"[ERROR] git commit failed\n{commit_result.stderr}")
        notify("חדשני — git commit נכשל ⚠️", commit_result.stderr[:80], tags="x", priority=4)
        sys.exit(1)
    print(commit_result.stdout.strip())

    # Step 5: Push to GitHub Pages
    if not run(["git", "push"], cwd=REPO_DIR):
        notify("חדשני — שגיאת רשת ⚠️", "", tags="x")
        sys.exit(1)

    print(f"[DONE] Update pushed to GitHub — {now}")
    
    # v3.2.16: High-priority success notification with version info
    expected_ts = data.get("generated_at", now)
    if verify_deployment(expected_ts):
        notify("חדשני — עודכן ✅", "", priority=5)
    else:
        print("[WARN] Sync verification timed out — sending notification anyway")
        notify("חדשני — עודכן (אימות נכשל) ⚠️", "", priority=3)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[FATAL] Unhandled exception: {e}")
        notify("חדשני — שגיאה לא צפויה ⚠️", str(e)[:80], tags="x", priority=4)
        sys.exit(1)
