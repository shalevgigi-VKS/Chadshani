# Chadshani — Primer
# Version: 3.2.6 | Last Updated: 2026-04-03
# This file is rewritten at the end of every session. Single source of truth for session startup.

---

## WHAT IS CHADSHANI
Financial-tech market intelligence desk in Hebrew.
SPA (5 pages): Macro → Sectors → Crypto → AI Frontier → Watchlist
Live site: https://shalevgigi-vks.github.io/Chadshani/
Updated twice daily: 07:00 + 19:00 Israel time (Task Scheduler runs 06:45 + 18:45)

---

## CURRENT VERSION: 3.2.6 (2026-04-03)
- SPA with hash routing, RTL Hebrew, Tailwind CSS
- Fonts: Space Grotesk (headlines), Heebo (body), Inter (labels)
- OG/Twitter meta tags in <head> → link previews show logo
- Gauge values (VIX, F&G) centered in cards
- notify() uses ensure_ascii=False → Hebrew works on iPhone
- CoinGecko fallback for TAO + KAS prices (yfinance TAO1-USD delisted)

---

## 7 CRITICAL OPERATING RULES
1. **No deploy without fresh data** — generate → validate → commit → push. Never push index.html alone.
2. **Maintenance page while generating** — index_maintenance.html must be live during data generation.
3. **Validate before deploy** — 12 checks must pass. Fail = abort, no commit.
4. **Gemini: Flash×2, Pro×1 max** — never add retries. Each failed Pro call = ~₪0.40.
5. **Track thinking tokens** — capture `thoughts_token_count` or budget is 3x understated.
6. **Budget cap ₪20/month** — abort at ₪20, warn at ₪18. Reset 1st of each month.
7. **One notification only** — after validation + push complete. Hebrew requires ensure_ascii=False.

---

## DATA FLOW
```
Free sources (yfinance, RSS, HN, F&G APIs, CoinGecko)
    → build_news_context() → ~20k char context string
    → Gemini API (text skeleton, no numbers)
    → patch_prices() → inject all real numbers
    → validate() → write data/latest.json
    → git commit + push → GitHub Pages
    → ntfy.sh notification to iPhone
```

See DATA_FETCHING_GUIDE.md for complete details on prompts, costs, validation rules.

---

## KEY FILES
| File | Purpose |
|------|---------|
| `generate_json.py` | Core data generator — all fetching + Gemini call |
| `chadshani_auto.py` | Orchestrator — budget, maintenance, deploy, notify |
| `index.html` | SPA frontend — reads data/latest.json |
| `index_maintenance.html` | Shown during data generation |
| `data/latest.json` | Current market intelligence data |
| `data/cost_log.json` | API cost log (thinking tokens included from 2026-04-02) |
| `DATA_FETCHING_GUIDE.md` | Full reference for external tools |
| `DECISIONS_LOG.md` | Design/logic decisions source of truth |
| `HANDOFF.md` | Session-to-session status |

---

## KNOWN ISSUES / WATCH LIST
- `TAO1-USD` on yfinance returns wrong price → CoinGecko fallback added (COINGECKO_MAP in generate_json.py)
- `DeprecationWarning: datetime.utcnow()` — cosmetic only, does not affect output
- `UnicodeDecodeError cp1255` in subprocess stdout — cosmetic only (Windows terminal encoding), data is correct
- Task Scheduler commit messages: Hebrew chars are logged as ???? in Windows event log — expected

---

## BUDGET STATUS (April 2026)
- Spent so far: ~₪2.73 / ₪20 (13.7%)
- Average run cost: ~₪0.10 (Flash) or ~₪0.40 (Pro fallback)
- Authoritative billing: https://aistudio.google.com/spend?project=gen-lang-client-0599677299

---

## HOW TO START NEXT SESSION
1. Read this primer.md
2. Read HANDOFF.md for last session's open items
3. Check cost_log.json for budget status
4. If making code changes → reference DATA_FETCHING_GUIDE.md first
