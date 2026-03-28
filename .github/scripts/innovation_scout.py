#!/usr/bin/env python3
"""
Innovation Scout — Claude Code Ecosystem Monitor
Runs every 4 hours via GitHub Actions.
Searches for new tools, CLIs, MCP servers, and skills that could enhance
the Claude Code global setup.
Sends a summary via ntfy if new/trending items are found.
"""

import os
import json
import time
import hashlib
import requests
from datetime import datetime, timezone, timedelta

NTFY_TOPIC = os.environ.get("NTFY_TOPIC", "CHA0511")
GH_TOKEN = os.environ.get("GH_TOKEN", "")
SCOUT_STATE_FILE = ".github/scripts/scout_state.json"

HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
if GH_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GH_TOKEN}"

# ── Topics to monitor ──────────────────────────────────────────────────────────
GITHUB_TOPICS = [
    "claude-code",
    "mcp-server",
    "claude-mcp",
    "anthropic-claude",
    "ai-cli",
    "llm-cli",
    "claude-tools",
    "claude-agent",
]

# Stars threshold — only report repos above this to reduce noise
MIN_STARS = 50

# Recency — only repos updated in last 7 days
MAX_AGE_DAYS = 7


# ── Helpers ────────────────────────────────────────────────────────────────────
def load_state():
    if os.path.exists(SCOUT_STATE_FILE):
        with open(SCOUT_STATE_FILE) as f:
            return json.load(f)
    return {"seen": []}


def save_state(state):
    os.makedirs(os.path.dirname(SCOUT_STATE_FILE), exist_ok=True)
    with open(SCOUT_STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def repo_id(repo):
    return repo["full_name"]


def search_topic(topic):
    url = "https://api.github.com/search/repositories"
    params = {
        "q": f"topic:{topic}",
        "sort": "updated",
        "order": "desc",
        "per_page": 10,
    }
    try:
        r = requests.get(url, headers=HEADERS, params=params, timeout=10)
        r.raise_for_status()
        return r.json().get("items", [])
    except Exception as e:
        print(f"  [warn] topic {topic}: {e}")
        return []


def search_query(query):
    url = "https://api.github.com/search/repositories"
    cutoff = (datetime.now(timezone.utc) - timedelta(days=MAX_AGE_DAYS)).strftime("%Y-%m-%d")
    params = {
        "q": f"{query} pushed:>{cutoff} stars:>{MIN_STARS}",
        "sort": "stars",
        "order": "desc",
        "per_page": 5,
    }
    try:
        r = requests.get(url, headers=HEADERS, params=params, timeout=10)
        r.raise_for_status()
        return r.json().get("items", [])
    except Exception as e:
        print(f"  [warn] query '{query}': {e}")
        return []


def is_recent(repo):
    pushed = repo.get("pushed_at", "")
    if not pushed:
        return False
    dt = datetime.fromisoformat(pushed.replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - dt).days <= MAX_AGE_DAYS


def format_repo(repo):
    stars = repo.get("stargazers_count", 0)
    desc = (repo.get("description") or "")[:120]
    updated = repo.get("pushed_at", "")[:10]
    return (
        f"⭐ {stars:,}  •  {repo['full_name']}\n"
        f"   {desc}\n"
        f"   🔗 {repo['html_url']}  •  updated {updated}"
    )


def send_ntfy(title, body, priority="default"):
    try:
        requests.post(
            f"https://ntfy.sh/{NTFY_TOPIC}",
            headers={
                "Title": title,
                "Tags": "telescope,robot",
                "Priority": priority,
                "Content-Type": "text/plain",
            },
            data=body.encode("utf-8"),
            timeout=10,
        )
        print(f"[ntfy] sent: {title}")
    except Exception as e:
        print(f"[ntfy] error: {e}")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print(f"[scout] starting — {datetime.now(timezone.utc).isoformat()}")
    state = load_state()
    seen = set(state.get("seen", []))
    new_items = []

    # 1. GitHub topic search
    for topic in GITHUB_TOPICS:
        print(f"[scout] topic: {topic}")
        repos = search_topic(topic)
        time.sleep(0.5)
        for repo in repos:
            rid = repo_id(repo)
            stars = repo.get("stargazers_count", 0)
            if rid not in seen and stars >= MIN_STARS and is_recent(repo):
                new_items.append(("topic:" + topic, repo))
                seen.add(rid)

    # 2. Keyword queries for high-value areas
    queries = [
        "claude code extension",
        "mcp server claude",
        "anthropic sdk cli",
        "ai terminal assistant",
    ]
    for q in queries:
        print(f"[scout] query: {q}")
        repos = search_query(q)
        time.sleep(0.5)
        for repo in repos:
            rid = repo_id(repo)
            if rid not in seen:
                new_items.append(("search", repo))
                seen.add(rid)

    # Save updated state
    state["seen"] = list(seen)
    state["last_run"] = datetime.now(timezone.utc).isoformat()
    save_state(state)

    print(f"[scout] new items found: {len(new_items)}")

    if not new_items:
        now_str = datetime.now(timezone.utc).strftime("%H:%M UTC")
        send_ntfy(
            "🔭 Innovation Scout — nothing new",
            f"Ran at {now_str} — no new repos found (tracking {len(seen)} repos).",
            priority="min",
        )
        print("[scout] heartbeat sent — nothing new")
        return

    # Deduplicate by repo name
    seen_names = set()
    deduped = []
    for tag, repo in new_items:
        if repo["full_name"] not in seen_names:
            seen_names.add(repo["full_name"])
            deduped.append((tag, repo))

    # Sort by stars
    deduped.sort(key=lambda x: x[1].get("stargazers_count", 0), reverse=True)
    top = deduped[:8]

    lines = [f"🔭 Innovation Scout — {len(deduped)} new tools/repos found\n"]
    for tag, repo in top:
        lines.append(format_repo(repo))
        lines.append("")

    if len(deduped) > 8:
        lines.append(f"...and {len(deduped) - 8} more.")

    body = "\n".join(lines)
    priority = "high" if len(deduped) >= 3 else "default"
    send_ntfy(f"🔭 Innovation Scout — {len(deduped)} new", body, priority)


if __name__ == "__main__":
    main()
