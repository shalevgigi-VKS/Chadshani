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
from datetime import datetime

NTFY_TOPIC = "CloudeCode"
BUDGET_ILS = 20.0
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


def notify(title, message, tags="white_check_mark"):
    """שליחת התראה דרך ntfy.sh JSON API — תמיכה מלאה בעברית."""
    try:
        payload = json.dumps({
            "topic": NTFY_TOPIC,
            "title": title,
            "message": message,
            "tags": [tags],
            "priority": 3
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://ntfy.sh",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"[NTFY] שגיאה בשליחת התראה: {e}")

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.abspath(os.path.join(PROJECT_DIR, "..", ".."))
DATA_REL     = os.path.join("Shalev's_Projects", "2_Chadshani", "data", "latest.json")
INDEX_REL    = os.path.join("Shalev's_Projects", "2_Chadshani", "index.html")
INDEX_REAL   = os.path.join(PROJECT_DIR, "index_backup_ORIGINAL.html")
INDEX_MAINT  = os.path.join(PROJECT_DIR, "index_maintenance.html")


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
        notify("חדשני — תקציב מוצה ⛔", msg, tags="x")
        sys.exit(1)
    if month_ils >= BUDGET_ILS * 0.9:
        notify("חדשני — אזהרת תקציב ⚠️",
               f"נוצלו {pct:.0f}% מהתקציב החודשי — ₪{month_ils:.2f} מתוך ₪{BUDGET_ILS:.0f}",
               tags="warning")

    # Step 1: Switch to maintenance page (site must not show stale data during update)
    import shutil
    shutil.copy2(INDEX_MAINT, os.path.join(REPO_DIR, INDEX_REL))
    if not run(["git", "add", INDEX_REL], cwd=REPO_DIR):
        sys.exit(1)
    commit_maint = subprocess.run(
        ["git", "commit", "-m", f"maintenance: updating data {now}"],
        capture_output=True, text=True, cwd=REPO_DIR
    )
    if commit_maint.returncode == 0:
        run(["git", "push"], cwd=REPO_DIR)
        print("[MAINTENANCE] site switched to maintenance page")
    else:
        print("[MAINTENANCE] no index change needed — skipping maintenance commit")

    # Step 2: Generate JSON (sets GEMINI_API_KEY from environment)
    generate_script = os.path.join(PROJECT_DIR, "generate_json.py")
    result = subprocess.run(
        [sys.executable, generate_script],
        cwd=PROJECT_DIR
    )
    if result.returncode != 0:
        print("[ERROR] generate_json.py failed — aborting")
        notify("חדשני — שגיאה", "תהליך יצירת הנתונים ואימותם נכשל", tags="x")
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
        ai_section = data.get("section_7_ai", [])
        if len(ai_section) < 4:
            issues.append(f"section_7_ai has {len(ai_section)} items (need 4)")
        placeholder_ai = sum(1 for item in ai_section
                             if "אין חדשות חדשות" in (item.get("update", "") or ""))
        if placeholder_ai >= 3:
            issues.append(f"section_7_ai: {placeholder_ai}/6 companies have no news (threshold: max 2)")
        if issues:
            print("[VALIDATE] FAIL:")
            for i in issues:
                print(f"  - {i}")
            notify("חדשני — נתונים לא עברו אימות", "\n".join(issues[:3]), tags="x")
            sys.exit(1)
        print(f"[VALIDATE] PASS — {len(data)} keys")
    except Exception as e:
        print(f"[VALIDATE] ERROR: {e}")
        notify("חדשני — שגיאה באימות", str(e), tags="x")
        sys.exit(1)

    # Step 3: Restore real site + stage data + index together
    shutil.copy2(INDEX_REAL, os.path.join(REPO_DIR, INDEX_REL))
    if not run(["git", "add", DATA_REL, INDEX_REL], cwd=REPO_DIR):
        sys.exit(1)

    # Step 4: Commit (skip if nothing changed)
    commit_result = subprocess.run(
        ["git", "commit", "-m", f"update {now}"],
        capture_output=True, text=True, cwd=REPO_DIR
    )
    if commit_result.returncode != 0:
        if "nothing to commit" in commit_result.stdout or "nothing to commit" in commit_result.stderr:
            print("[SKIP] Nothing changed — no commit needed")
            sys.exit(0)
        print(f"[ERROR] git commit failed\n{commit_result.stderr}")
        notify("חדשני — תקלה", "שגיאה בשמירת הנתונים במסד", tags="x")
        sys.exit(1)
    print(commit_result.stdout.strip())

    # Step 5: Push to GitHub Pages
    if not run(["git", "push"], cwd=REPO_DIR):
        notify("חדשני — תקלת רשת", "שגיאה בהעלת סנכרון התוכן לשרת", tags="x")
        sys.exit(1)

    print(f"[DONE] Update deployed — {now}")
    # Cost summary: show last run + monthly total from local log
    # Note: local calc may undercount thinking tokens — actual Google bill is authoritative
    runs_today = [r for r in read_cost_log().get("runs", [])
                  if r.get("ts", "").startswith(datetime.utcnow().strftime("%Y-%m-%d"))]
    run_ils = sum(r.get("cost_ils", 0.0) for r in runs_today)
    month_after = monthly_cost_ils()
    remaining = BUDGET_ILS - month_after
    cost_line = (f"ריצה: ₪{run_ils:.4f} | חודש מקומי: ₪{month_after:.2f}/₪{BUDGET_ILS:.0f} "
                 f"| נשאר: ₪{remaining:.2f}\n"
                 f"(חיוב אמיתי — בדוק Google AI Studio)")
    notify("חדשני — עודכן ✅", f"האתר עודכן בכל נתוני השוק החדשים\n{cost_line}")


if __name__ == "__main__":
    main()
