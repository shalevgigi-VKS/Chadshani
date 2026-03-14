"""
generate_website.py — reads temp_news.txt, builds website/index.html, pushes to GitHub Pages, sends URL to Telegram.
"""
import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path

import requests

# ── CONFIG ── edit these before first run ──────────────────────────────────
TELEGRAM_BOT_TOKEN = "8630512351:AAEgoHo7u22HVXS20xKc-7Q8uWzMYmqDD38"
TELEGRAM_CHAT_ID   = "-1003840479051"
GITHUB_USER        = "YOUR_GITHUB_USER"   # e.g. "shalev"
GITHUB_REPO        = "chadshani"          # repo name with Pages enabled
# ──────────────────────────────────────────────────────────────────────────

ROOT         = Path(__file__).parent
TEMP_NEWS    = ROOT / "temp_news.txt"
TEMPLATE     = ROOT / "website" / "index.html"
OUTPUT_HTML  = ROOT / "website" / "index.html"
PAGES_URL    = f"https://{GITHUB_USER}.github.io/{GITHUB_REPO}/"

CATEGORY_MAP = {
    "AI": "AI", "בינה מלאכותית": "AI", "מודל": "AI", "LLM": "AI",
    "שבב": "שבבים", "חומרה": "שבבים", "NVIDIA": "שבבים", "GPU": "שבבים",
    "שוק": "שווקים", "מניה": "שווקים", "בורסה": "שווקים", "נאסד": "שווקים",
    "קריפטו": "קריפטו", "ביטקוין": "קריפטו", "BTC": "קריפטו", "ETH": "קריפטו",
    "תוכנה": "תוכנה", "קוד": "תוכנה", "פיתוח": "תוכנה", "GitHub": "תוכנה",
}

def detect_category(section_header: str) -> str:
    for keyword, cat in CATEGORY_MAP.items():
        if keyword.lower() in section_header.lower():
            return cat
    return "כללי"

def parse_news(text: str) -> list[dict]:
    """Parse temp_news.txt sections into structured news items."""
    items = []
    sections = re.split(r'\n(?=##\s)', text.strip())

    for section in sections:
        lines = [l.strip() for l in section.strip().splitlines() if l.strip()]
        if not lines:
            continue

        # Section header → category
        header = lines[0].lstrip('#').strip()
        category = detect_category(header)

        # Subsections: lines starting with ### or bold **title**
        subsections = []
        cur_title = header
        cur_bullets = []

        for line in lines[1:]:
            if line.startswith('###') or line.startswith('**'):
                if cur_bullets or cur_title != header:
                    subsections.append((cur_title, cur_bullets))
                cur_title = line.lstrip('#').strip().strip('*')
                cur_bullets = []
            elif line.startswith('-') or line.startswith('•'):
                cur_bullets.append(line.lstrip('-•').strip())
            elif line and not line.startswith('#'):
                cur_bullets.append(line)

        if cur_title or cur_bullets:
            subsections.append((cur_title, cur_bullets))

        if not subsections:
            continue

        for title, bullets in subsections:
            if not title or title == header:
                continue
            summary = bullets[0] if bullets else ""
            items.append({
                "category": category,
                "title": title,
                "summary": summary,
                "bullets": bullets[:4],
            })

    return items

def build_html(news_items: list[dict], updated_str: str) -> str:
    template = TEMPLATE.read_text(encoding="utf-8")
    news_json = json.dumps(news_items, ensure_ascii=False, indent=2)
    html = template.replace("PLACEHOLDER_NEWS_JSON", news_json)
    html = html.replace("PLACEHOLDER_DATETIME", updated_str)
    return html

def git_push(commit_msg: str):
    cmds = [
        ["git", "-C", str(ROOT), "add", "website/index.html"],
        ["git", "-C", str(ROOT), "commit", "-m", commit_msg],
        ["git", "-C", str(ROOT), "push"],
    ]
    for cmd in cmds:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[GIT_ERROR] {' '.join(cmd)}\n{result.stderr}")
            return False
    return True

def send_telegram(message: str):
    requests.post(
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"},
        timeout=10,
    )

def main():
    if not TEMP_NEWS.exists():
        print("[ERROR] temp_news.txt not found")
        return

    text = TEMP_NEWS.read_text(encoding="utf-8")
    if not text.strip():
        print("[ERROR] temp_news.txt is empty")
        return

    now = datetime.now()
    updated_str = now.strftime("%d.%m.%Y %H:%M")

    print("[STEP_1] Parsing news...")
    news_items = parse_news(text)
    print(f"[STEP_1_COMPLETE] {len(news_items)} items parsed")

    print("[STEP_2] Building HTML...")
    html = build_html(news_items, updated_str)
    OUTPUT_HTML.write_text(html, encoding="utf-8")
    print("[STEP_2_COMPLETE]")

    print("[STEP_3] Pushing to GitHub Pages...")
    commit_msg = f"update {now.strftime('%Y-%m-%d %H:%M')}"
    ok = git_push(commit_msg)
    if ok:
        print("[STEP_3_COMPLETE]")
    else:
        print("[STEP_3_WARN] Git push failed — sending local path instead")

    print("[STEP_4] Sending Telegram...")
    url = PAGES_URL if ok else str(OUTPUT_HTML)
    msg = (
        f"📊 <b>חדשני עודכן</b> — {updated_str}\n"
        f"🔗 <a href=\"{url}\">{url}</a>\n"
        f"📌 {len(news_items)} פריטים"
    )
    send_telegram(msg)
    print("[STEP_4_COMPLETE]")

    # Cleanup
    TEMP_NEWS.unlink(missing_ok=True)
    print("[PIPELINE_COMPLETE]")

if __name__ == "__main__":
    main()
