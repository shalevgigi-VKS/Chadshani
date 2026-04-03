# Chadshani — Primer
# Version: 3.2.16 | Last Updated: 2026-04-03
# Rewritten at end of every session. Single source of truth for session startup.

---

## WHAT IS CHADSHANI
Financial-tech market intelligence desk in Hebrew.
SPA (5 pages): Macro → Sectors → Crypto → AI Frontier → Watchlist
Live site: https://shalevgigi-vks.github.io/Chadshani/
Updated twice daily: 07:00 + 19:00 Israel time (Task Scheduler at 06:45 + 18:45)

---

## CURRENT VERSION: 3.2.16 (2026-04-03)

### UI / Design
- Header: large logo (w-14→w-24 on desktop), hover scale effect, rounded-2xl/3xl
- Profile badge: circular avatar (rounded-full), not rectangular
- Dashboard bar: 4 columns — current time, last update, next update, **market status (NYSE open/closed)**
- Hero: full-bleed dark gradient overlay, white text on image background
- Sector cards: "Aggressive Heatmap Coloring" — green/red bg based on actual flow amount
- Entrance animations: fadeInUp for all sections (staggered delay)
- glass-card: improved — blur 24px + saturate 180% + better shadow
- noise-bg: 2% noise texture overlay for depth
- Crypto page: local F&G mini-indicator on the page itself

### JS / Logic
- Market status widget: live NYSE open/closed (Mon-Fri 9:30-16:00 NY) with pulsing dot
- AI logo map: 22 companies (was 6: OpenAI, Google, Anthropic, Meta, xAI, Perplexity + Mistral, Nvidia, AMD, Microsoft, Amazon, Apple, Tesla, NIO, Intel, TSMC, Arm, Broadcom, Palantir, Snowflake, etc.)
- Ticker dir="ltr" fixed for correct RTL-in-LTR animation on mobile
- Sector flow calc: improved parser handles both B and M suffixes

### Bug Fixes (in this session)
- OG/Twitter meta tags added → link previews show logo
- notify() ensure_ascii=False → Hebrew works on iPhone
- CoinGecko fallback for TAO + KAS (yfinance TAO1-USD delisted)
- shutil.copy2 self-copy bug fixed (PermissionError on Windows)
- Gauge values centered (text-center)

---

## 7 CRITICAL OPERATING RULES
1. **No deploy without fresh data** — generate → validate → commit → push. Never push index.html alone.
2. **Maintenance page while generating** — index_maintenance.html live during generation.
3. **Validate before deploy** — 12 checks must pass. Fail = abort, no commit.
4. **Gemini: Flash×2, Pro×1 max** — never add retries. Each failed Pro call = ~₪0.40.
5. **Track thinking tokens** — capture `thoughts_token_count` or budget is 3x understated.
6. **Budget cap ₪20/month** — abort at ₪20, warn at ₪18. Reset 1st of each month.
7. **One notification only** — after validation + push complete. Hebrew requires ensure_ascii=False.

---

## DATA FLOW
```
Free sources (yfinance, RSS×12, HN, F&G APIs, CoinGecko)
    → build_news_context() → ~20k char context
    → Gemini 2.5 Flash×2 → Pro×1 (last resort)
    → patch_prices() → inject all real numbers
    → validate() 12 checks
    → write data/latest.json
    → git commit + push → GitHub Pages
    → ntfy.sh → iPhone notification
```

---

## KEY FILES
| File | Purpose |
|------|---------|
| `generate_json.py` | Core: fetch + Gemini + inject + validate |
| `chadshani_auto.py` | Orchestrator: budget, maintenance, deploy, notify |
| `index.html` | SPA v3.2.16 |
| `index_maintenance.html` | Shown during data generation |
| `data/latest.json` | Current market data |
| `data/cost_log.json` | API cost log (thinking tokens tracked) |
| `DATA_FETCHING_GUIDE.md` | Full reference for external tools / other AI |
| `DECISIONS_LOG.md` | Design decisions source of truth |

---

## KNOWN ISSUES / WATCH LIST
- `TAO1-USD` yfinance delisted → CoinGecko fallback (COINGECKO_MAP in generate_json.py)
- `DeprecationWarning datetime.utcnow()` — cosmetic only
- `UnicodeDecodeError cp1255` in subprocess stdout — cosmetic only (Windows terminal)
- chadshani_auto.py: copy src==dst is now guarded (os.path.abspath check)

---

## BUDGET STATUS (April 2026)
- Spent today: ~₪2.73 / ₪20 (13.7%) — Task Scheduler ran multiple times
- Average run cost: ~₪0.10-0.15 (Flash) | ~₪0.40+ (Pro fallback)
- Authoritative: https://aistudio.google.com/spend?project=gen-lang-client-0599677299

---

## HOW TO START NEXT SESSION
1. Read this primer.md
2. Read HANDOFF.md for open items
3. Check data/cost_log.json for monthly budget
4. Reference DATA_FETCHING_GUIDE.md before touching generate_json.py
