#!/usr/bin/env python3
"""
Chadshani Auto-Update Script
Runs generate_json.py then git commit + push to deploy GitHub Pages.
Called by Windows Task Scheduler (chadshani-0600, chadshani-1200, chadshani-2030).
"""
import subprocess
import sys
import os
import json
import urllib.request
from datetime import datetime

NTFY_TOPIC = "CHA0511"


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
DATA_REL = os.path.join("Shalev's_Projects", "1_chadshani", "data", "latest.json")


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
        notify("Chadshani FAILED", f"generate_json.py נכשל — {now}", tags="x")
        sys.exit(1)

    # Step 2: Stage only the data file
    if not run(["git", "add", DATA_REL], cwd=REPO_DIR):
        sys.exit(1)

    # Step 3: Commit (skip if nothing changed)
    commit_result = subprocess.run(
        ["git", "commit", "-m", f"update {now}"],
        capture_output=True, text=True, cwd=REPO_DIR
    )
    if commit_result.returncode != 0:
        if "nothing to commit" in commit_result.stdout or "nothing to commit" in commit_result.stderr:
            print("[SKIP] Nothing changed — no commit needed")
            sys.exit(0)
        print(f"[ERROR] git commit failed\n{commit_result.stderr}")
        sys.exit(1)
    print(commit_result.stdout.strip())

    # Step 4: Push to GitHub Pages
    if not run(["git", "push"], cwd=REPO_DIR):
        sys.exit(1)

    print(f"[DONE] Update deployed — {now}")
    notify("Chadshani Updated", f"האתר עודכן בהצלחה\n{now}")


if __name__ == "__main__":
    main()
