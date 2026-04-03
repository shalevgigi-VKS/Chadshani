# Chadshani — Technical Handoff (v3.3.7)

_Last updated: 2026-04-03_

---

## Architecture Overview

```
Task Scheduler (Windows)
  06:45 + 18:45 Israel time
         │
         ▼
chadshani_auto.py
  ├── Budget check (monthly ₪ limit)
  ├── generate_json.py  ←── Gemini API (zero-cost model)
  ├── Validate JSON
  ├── Copy index_template.html → index.html
  ├── git add + commit + push
  └── Verify deployment + ntfy notification
         │
         ▼
GitHub Pages (live)
  https://shalevgigi-vks.github.io/Chadshani/
```

---

## Data Sources — ALL COSTS

| Source | Data | Cost |
|--------|------|------|
| `yfinance` | Stock prices (S&P500, Nasdaq, semis, software, watchlist) | **₪0 — free library** |
| `alternative.me/fng` | Crypto Fear & Greed Index | **₪0 — free public API** |
| CNN Business (unofficial) | Stocks Fear & Greed | **₪0 — free scrape** |
| Google News RSS | AI company news per company | **₪0 — free RSS** |
| `feedparser` | RSS parsing | **₪0 — free library** |
| **Gemini API** | All text analysis, summaries, narratives | **₪0 — zero-cost model** |

### Gemini zero-cost model
Model: `models/gemini-2.0-flash-lite-preview-02-05`
This model has `free_tier: True` per the Gemini API. Locked since v3.2.11.
Previous bills (e.g. ₪18.61) were from older model `gemini-pro` — do NOT revert.

**Monthly budget cap:** ₪25 in `chadshani_auto.py` → `BUDGET_ILS = 25.0`
This is a safety net only. Current monthly cost should be ₪0.00.

---

## How to Run a Manual Update

### Option A — Full automated run (recommended)
```bash
cd "e:/Claude"
python "Shalev's_Projects/2_Chadshani/chadshani_auto.py"
```
This runs the full pipeline: generate → validate → copy template → commit → push → verify → notify.

### Option B — Generate data only (no push)
```bash
cd "e:/Claude/Shalev's_Projects/2_Chadshani"
python generate_json.py
```
Output: `data/latest.json`

### Option C — Just push existing data
```bash
cd "e:/Claude"
git add "Shalev's_Projects/2_Chadshani/data/latest.json" "Shalev's_Projects/2_Chadshani/index.html"
git commit -m "update manual YYYY-MM-DD HH:MM"
git push
```

---

## Monitoring a Running Update

Run `chadshani_auto.py` in a terminal and watch stdout. Key log lines:

```
[START] chadshani_auto — 2026-04-03 18:45
[BUDGET] this month: ₪0.00 / ₪25 (0.0%)
[INFO] skipped maintenance mode switch
[VALIDATE] PASS — 14 keys
[CHECK] Polling live JSON at https://shalevgigi-vks.github.io/Chadshani/data/latest.json...
[MATCH] Live JSON updated! generated_at=2026-04-03T18:45:12Z
[NTFY] שנשלחה התראה: חדשני — עודכן ✅
[DONE] Update pushed to GitHub — 2026-04-03 18:45
```

If `[WAIT]` appears repeatedly → GitHub Pages CDN is slow (normal up to 90s).
If `[WARN] Sync verification timed out` → push succeeded but CDN didn't update within 120s. Check live site manually.

---

## Notification System (ntfy.sh)

Topic: `CloudeCode`
App: [ntfy.sh](https://ntfy.sh) — subscribe on iPhone to receive push notifications.

Success: priority 5 (high) — `חדשני — עודכן ✅`
Error: priority 4 — `חדשני — שגיאה ⚠️`
Budget exceeded: priority 3 — `חדשני — תקציב מוצה ⛔`

---

## Task Scheduler Configuration

Two tasks in Windows Task Scheduler:
- `chadshani-0645` — runs at 06:45 Israel time
- `chadshani-1845` — runs at 18:45 Israel time

Both call: `python.exe "e:/Claude/Shalev's_Projects/2_Chadshani/chadshani_auto.py"`
Working directory: `e:/Claude`

---

## File Structure

```
2_Chadshani/
├── index_template.html    ← SOURCE OF TRUTH for UI (edit this, NOT index.html)
├── index.html             ← Copied from template by chadshani_auto.py on every run
├── chadshani_auto.py      ← Orchestrator: generate → validate → commit → push → notify
├── generate_json.py       ← Data fetching + Gemini AI analysis → data/latest.json
├── data/
│   ├── latest.json        ← Generated JSON (deployed to GitHub Pages)
│   └── cost_log.json      ← Cumulative API cost tracking
├── chadshani_logo.jpg     ← Favicon + OG image
└── TECH_HANDOFF.md        ← This file
```

**CRITICAL:** Never edit `index.html` directly. Always edit `index_template.html`.
`chadshani_auto.py` copies the template on every run, overwriting any direct changes to `index.html`.

---

## JSON Schema (latest.json)

Key fields rendered by the frontend:

| Field | Page | Notes |
|-------|------|-------|
| `generated_at` | All (deployment verify) | ISO timestamp, used by verify_deployment() |
| `section_1_situation.headline` | Macro hero | Must not be empty or placeholder |
| `section_1_situation.alert.title/value` | Macro alert card | `value` must be short rating (קריטי/גבוה/בינוני), not same as title |
| `section_1_situation.analysis` | Macro | Full text paragraph |
| `markets.sp500/nasdaq/vix` | Global ticker bar + Macro | Number values |
| `section_2_news[]` | Macro news cards | Min 4 items, each body >= 120 chars |
| `section_4_crypto.coins[]` | Crypto coin grid | Per coin: name, price, change_24h, icon |
| `section_4_crypto.narrative/smart_money/whale_activity` | Crypto narrative | Text paragraphs |
| `section_8_conclusion.text/action` | Crypto conclusion | action field rendered as "פעולה מוצעת" |
| `section_7_ai[]` | AI page | Per company: company, product, updates[] (7 items), status |
| `section_5_semis[]` | Watchlist | 11 tickers (NVDA, AMD, INTC, QCOM, AVGO, TSM, ASML, MU, ARM, TXN, AMAT) |
| `section_6_software[]` | Watchlist | 10 tickers |

---

## Validation Rules (chadshani_auto.py)

The script validates these fields before every commit:
- `generated_at` — must exist
- `section_1_situation.headline` — not empty, not placeholder
- `section_1_situation.alert.value` — not "N/A", not same as title
- `markets.sp500/nasdaq/vix` — must all exist
- `section_2_news` — min 4 items, each >= 120 chars
- `section_7_ai` — min 4 items, max 2 with "אין חדשות"

If validation fails → script exits without committing. Fix in generate_json.py and re-run.

---

## Recovery Runbook

### אם קיבלת ntfy שגיאה:

| הודעה | סיבה | פעולה |
|---|---|---|
| "שגיאה ביצירת נתונים" | `generate_json.py` נכשל | בדוק `GEMINI_API_KEY`, בדוק RSS accessibility |
| "ולידציה נכשלה" | נתונים גרועים מגמיני | הרץ ידנית, בדוק `data/latest.json` |
| "latest.json חסר" | `generate_json.py` לא סיים לכתוב | בדוק שגיאות Python ב-Task Scheduler log |
| "JSON פגום" | קובץ נחתך באמצע | הרץ ידנית מחדש |
| "git add/commit נכשל" | בעיית git repo | בדוק `git status` ב-`e:\Claude` |
| "שגיאת רשת" (push) | בעיית internet / GitHub auth | בדוק internet + `git push` ידנית |
| "האתר לא עודכן" (watchdog) | ריצה לא הצליחה בשקט | הרץ ידנית, בדוק Task Scheduler |
| "האתר לא נגיש" (watchdog) | GitHub Pages down / DNS | בדוק https://shalevgigi-vks.github.io/Chadshani |

### הרצה ידנית (מכל terminal):

```powershell
python "e:\Claude\Shalev's_Projects\2_Chadshani\chadshani_auto.py"
```

### אם האתר ישן מ-24 שעות:

1. הרץ `chadshani_auto.py` ידנית — עקוב אחרי output
2. אם `generate_json.py` נכשל: בדוק `GEMINI_API_KEY` מוגדר
   ```powershell
   [System.Environment]::GetEnvironmentVariable('GEMINI_API_KEY','User')
   ```
3. אם ולידציה נכשלה: פתח `data/latest.json` וחפש את השדה הבעייתי
4. גיבוי תמיד זמין ב-`git log` — הגרסה האחרונה של `data/latest.json`

### בדיקת מצב Task Scheduler:

```powershell
Get-ScheduledTask -TaskName "chadshani*" | Select TaskName, State, LastRunTime, LastTaskResult
```

`LastTaskResult = 0` = הצלחה. כל מספר אחר = כשל.

### Watchdog tasks:

| Task | זמן | מטרה |
|---|---|---|
| `chadshani-watchdog-0800` | 08:00 יומי | בדיקה 1h15m אחרי ריצת 06:45 |
| `chadshani-watchdog-2000` | 20:00 יומי | בדיקה 1h15m אחרי ריצת 18:45 |

---

## Performance — Frontend Build (v3.3.7+)

### Tailwind CSS — Static Build (NOT CDN)

The site uses a **pre-built, purged Tailwind CSS** file instead of the CDN Play script.

| Resource | Before | After |
|----------|--------|-------|
| Tailwind CDN (runtime scan) | 356KB + browser scan | 0 |
| `assets/tailwind.min.css` | — | 40KB (purged) |
| Tailwind runtime JS | 356KB | 0 |

**When to regenerate `assets/tailwind.min.css`:**
Only when `index_template.html` adds new Tailwind classes.
```bash
cd "Shalev's_Projects/2_Chadshani"
npm run build:css          # one-time build
npm run watch:css          # during development
```

**Never edit `assets/tailwind.min.css` directly** — it is auto-generated from `index_template.html` via `tailwind.config.js`.

### Other Optimizations Applied
- `preconnect` for `fonts.googleapis.com` + `fonts.gstatic.com`
- Material Symbols subsetted via `icon_names=` param (20 icons only)
- `latest.json` cache: 5-minute window (`Math.floor(Date.now()/300000)`) instead of no-cache

### Rebuild After Template Changes
```bash
npm run build:css && cp index_template.html index.html
git add assets/tailwind.min.css index_template.html index.html
git commit -m "fix(chadshani): rebuild CSS + sync template"
git push
```

---

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v3.3.7 | 2026-04-03 | Performance: static Tailwind CSS (40KB vs 356KB CDN), preconnect fonts, Material Symbols subset, JSON 5-min cache |
| v3.3.6 | 2026-04-03 | Gemini 2.5-flash-lite (richer content), notification title-only, trailing-comma JSON repair, Task Scheduler path fix |
| v3.3.2 | 2026-04-03 | Notification fix (TypeError + verify_deployment), heading unification (.page-h2), browser tab title, AI 7 updates/company, TECH_HANDOFF rewrite |
| v3.3.1 | 2026-04-03 | 10 UI fixes: hero height, sidebar bio removed, alert dedup, RTL crypto cards, F&G legend, Hebrew "מסקנה טקטית", narrative icons, Google favicon logos |
| v3.3.0 | 2026-04-03 | Mobile design: pill ticker, circular gauges, alert bar |
| v3.2.17 | 2026-04-03 | Budget fix (₪25 cap), validation completeness for section_7_ai |
| v3.2.16 | 2026-04-03 | High-priority ntfy, deployment verification polling |
| v3.2.11 | ~2026-03-28 | Zero-cost Gemini lockdown (flash-lite-preview) — ₪0/month |
