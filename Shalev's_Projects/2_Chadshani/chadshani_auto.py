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
DATA_REL = os.path.join("Shalev's_Projects", "2_Chadshani", "data", "latest.json")


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

    # Step 1: Generate JSON (sets GEMINI_API_KEY from environment)
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

    # Step 3: Stage only the data file
    if not run(["git", "add", DATA_REL], cwd=REPO_DIR):
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
    notify("חדשני — עודכן", "האתר עודכן בהצלחה בכל נתוני השוק החדשים")


if __name__ == "__main__":
    main()
