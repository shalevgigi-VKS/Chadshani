# Chadshani — Data Fetching Guide
# Version: 3.2.6 | Last Updated: 2026-04-03
# PURPOSE: Complete reference for any tool (Claude, Cursor, GPT, scripts) to run Chadshani updates
# without wasting money. Read this BEFORE touching generate_json.py.

---

## 1. ARCHITECTURE OVERVIEW

```
generate_json.py  →  data/latest.json  →  index.html reads it on load
chadshani_auto.py →  orchestrates: budget check → maintenance → generate → validate → commit → push → notify
Task Scheduler    →  runs chadshani_auto.py at 06:45 + 18:45 Israel time (daily)
```

---

## 2. FREE DATA SOURCES (Zero API cost)

These are fetched BEFORE calling Gemini. They are the context Gemini analyzes.

| Source | What it provides | Auth | Cost |
|--------|-----------------|------|------|
| **yfinance** | Stock/crypto prices, news headlines | None | Free |
| **CNN F&G API** | Stock Fear & Greed index (0-100) | None | Free |
| **alternative.me** | Crypto Fear & Greed index (0-100) | None | Free |
| **Google News RSS** | Company-specific news (5 feeds) | None | Free |
| **Tech RSS feeds** | TechCrunch AI, VentureBeat, The Verge, ArsTechnica, OpenAI Blog, DeepMind, Meta AI Eng | None | Free |
| **Hacker News API** | Top 60 stories, filtered for AI | None | Free |
| **CoinGecko API** | TAO (Bittensor) + KAS (Kaspa) prices | None | Free |

### RSS Feed List (in generate_json.py `AI_RSS_FEEDS`)
```
TechCrunch AI:      https://techcrunch.com/category/artificial-intelligence/feed/
VentureBeat AI:     https://venturebeat.com/category/ai/feed/
The Verge:          https://www.theverge.com/rss/index.xml
ArsTechnica:        https://feeds.arstechnica.com/arstechnica/index
OpenAI Blog:        https://openai.com/blog/rss.xml
Google DeepMind:    https://deepmind.google/blog/feed/basic
Meta AI Eng:        https://engineering.fb.com/category/ai-research/feed/
GNews Anthropic:    https://news.google.com/rss/search?q=anthropic+claude&hl=en-US&gl=US&ceid=US:en
GNews Gemini:       https://news.google.com/rss/search?q=google+gemini+AI&hl=en-US&gl=US&ceid=US:en
GNews Llama:        https://news.google.com/rss/search?q=meta+llama+AI&hl=en-US&gl=US&ceid=US:en
GNews Grok:         https://news.google.com/rss/search?q=xai+grok&hl=en-US&gl=US&ceid=US:en
GNews Perplexity:   https://news.google.com/rss/search?q=perplexity+AI&hl=en-US&gl=US&ceid=US:en
```

### Recency Filter
```python
MAX_NEWS_AGE_DAYS = 7   # Items older than 7 days are skipped
```
This is critical — RSS feeds return weeks-old items. Without this filter, Gemini analyzes stale news.

---

## 3. GEMINI API — COST STRATEGY

### Model Cascade (DO NOT CHANGE)
```
Flash attempt 1  →  Flash attempt 2  →  Pro attempt 1  →  FALLBACK (use last JSON)
```
- **Gemini 2.5 Flash**: cheap, fast — try twice
- **Gemini 2.5 Pro**: expensive, accurate — last resort only (1 attempt max)
- Never add more retries — each failed Pro call = ~₪0.40

### Pricing (April 2026)
| Model | Input | Output | Thinking tokens |
|-------|-------|--------|-----------------|
| Gemini 2.5 Flash | $0.075/M | $0.30/M | **$3.50/M** |
| Gemini 2.5 Pro | $1.25/M | $10.00/M | **$3.50/M** |
| USD→ILS rate | 3.70 | | |

### CRITICAL: Thinking Tokens
Gemini 2.5 bills thinking tokens SEPARATELY at $3.50/M.
Without capturing `thoughts_token_count`, local cost log shows ~3x LESS than actual Google billing.

```python
usage = response.usage_metadata
in_tok = usage.prompt_token_count
out_tok = usage.candidates_token_count
think_tok = (getattr(usage, "thoughts_token_count", 0) or
             getattr(usage, "thinking_token_count", 0) or 0)
cost_usd = in_tok/1_000_000 * 0.075 + out_tok/1_000_000 * 0.30 + think_tok/1_000_000 * 3.50
```

### Real cost per run
- Average: ~₪0.10-0.15 (Flash) or ~₪0.40+ (Pro)
- Monthly (2 runs/day × 30): ~₪3-5
- Monthly cap: ₪20

### Verify actual billing
Manual check only (requires Google auth — cannot be automated):
**https://aistudio.google.com/spend?project=gen-lang-client-0599677299**

---

## 4. COST LOG FORMAT

File: `data/cost_log.json`
```json
{
  "runs": [
    {
      "ts": "2026-04-03T07:43:00Z",
      "model": "gemini-2.5-flash",
      "in_tokens": 8424,
      "out_tokens": 7779,
      "think_tokens": 7665,
      "cost_usd": 0.02979,
      "cost_ils": 0.1102
    }
  ],
  "total_usd": 0.58,
  "total_ils": 2.13
}
```

### Budget Guard (in chadshani_auto.py)
```python
BUDGET_ILS = 20.0
month_ils = monthly_cost_ils()   # sums cost_ils for current YYYY-MM
if month_ils >= BUDGET_ILS:      # → abort + notify
if month_ils >= BUDGET_ILS*0.9:  # → warn only
```

---

## 5. THE PROMPTS (word-for-word)

### SYSTEM_PROMPT
```
אתה "חדשני" — דסק חדשות מודיעיני פיננסי-טכנולוגי בכיר.
שפה: עברית בלבד. חריגים: טיקרים, שמות חברות, שמות מוצרים רשמיים.
סגנון: אנליטי, צפוף, מעמיק. אין להמציא מידע מספרי.

כללי התייעלות ואמת מחמירים:
- חיסכון בטוקנים: התנסח בצורה המדויקת, הקצרה והתמציתית ביותר, ללא מילות פתיחה או סיום.
- אסור להמציא שמות מוצרים, שמות קוד, גרסאות, מודלים, או הכרזות שלא אומתו במקור ידועה.
- במקרה שאין חדשות בתחום מסוים, חובה להציג את החדשות האחרונות הידועות במקום להשאיר אזור ריק.
- section_7_ai: כתוב אך ורק מוצרים ומודלים שהוכרזו רשמית. אין שמות קוד בדויים.
- ספק מידע עובדתי בלבד. ספקולציות יסומנו במפורש כ"לפי דיווחים" או "צפוי".
```

### JSON_PROMPT structure
Gemini generates TEXT FIELDS ONLY. All prices/numbers are injected afterward by `patch_prices()`.
Fields Gemini writes: headline, analysis, cards, alert (text), gauge labels/zones, news titles/body/so_what, sector notes, crypto notes, AI company updates, conclusion, watchlist signals.
Fields Gemini does NOT write: prices, change%, flow_amount, VIX value, F&G values.

### No Google Search grounding
This saves ~92% of API cost. Free RSS + yfinance replace it entirely.

---

## 6. DATA INJECTION (patch_prices)

After Gemini returns the text skeleton, `patch_prices()` injects all real numbers:

| Section | Source | What's injected |
|---------|--------|-----------------|
| section_3_sectors | yfinance ETF prices | change%, flow_direction, flow_amount |
| section_5_semis | yfinance stock prices | price, change% |
| section_6_software | yfinance stock prices | price, change% |
| section_4_crypto | yfinance + CoinGecko | price, change_24h |
| markets block | yfinance indices | sp500, nasdaq, vix, dji, yield_10y, gold, silver, oil, btc, eth, dxy |
| gauges | yfinance VIX + F&G APIs | vix.value, fear_greed_stock.value, fear_greed_crypto.value |

### Crypto ticker map
```python
CRYPTO_MAP = {
    "BTC": "BTC-USD", "ETH": "ETH-USD", "SOL": "SOL-USD",
    "LINK": "LINK-USD", "XRP": "XRP-USD", "TAO": "TAO1-USD",
    "KAS": "KAS-USD", "ADA": "ADA-USD"
}
# CoinGecko fallback (when yfinance returns None):
COINGECKO_MAP = {"TAO": "bittensor", "KAS": "kaspa"}
```

---

## 7. VALIDATION RULES (must pass before deploy)

```python
PLACEHOLDERS = ("לא זמין", "$...", None, "", "אין חדשות חדשות מהשבוע האחרון.",
                "עדכון ידוע: לא זמין", "לא זמין.", "אין עדכון")
```

Checks (in both generate_json.py and chadshani_auto.py):
1. `generated_at` present
2. `headline` not empty/placeholder
3. `alert.value` not N/A or placeholder
4. `markets.sp500`, `markets.nasdaq`, `markets.vix` present
5. `section_2_news` ≥ 4 items, no "אין חדשות" in body
6. `section_7_ai` ≥ 4 items, max 2/6 companies with "אין חדשות חדשות"
7. All prices in section_4_crypto not placeholder
8. section_3_sectors ≥ 11 items
9. section_5_semis ≥ 10 items
10. section_6_software ≥ 10 items
11. No empty nested objects
12. Watchlist rising + falling each ≥ 6 items

---

## 8. FULL RUN WORKFLOW

```
chadshani_auto.py:
1. Check monthly budget (cost_log.json) — abort if ≥₪20
2. Switch index.html → index_maintenance.html → git commit + push
3. Run generate_json.py:
   a. Fetch all free sources (RSS, yfinance, F&G, HN)
   b. Build context string (~20k chars)
   c. Call Gemini Flash×2, Pro×1 if needed
   d. patch_prices() — inject all real numbers
   e. validate() — reject if any check fails
   f. Write data/latest.json
4. Validate latest.json again (chadshani_auto double-check)
5. Copy index.html back (if src≠dst) + git add data/latest.json index.html
6. git commit + push
7. notify("חדשני עודכן ✅", "₪X.XX מתוך ₪20")
```

---

## 9. NOTIFICATIONS (ntfy.sh)

Topic: `CloudeCode`
CRITICAL: must use `ensure_ascii=False` + `charset=utf-8` or Hebrew shows as ???? on iPhone.

```python
json.dumps(payload, ensure_ascii=False).encode("utf-8")
headers={"Content-Type": "application/json; charset=utf-8"}
```

Success: `"חדשני עודכן ✅"` | `"₪X.XX מתוך ₪20"`
Failure: `"חדשני — שגיאה"` | short reason
Budget warn: `"חדשני — אזהרת תקציב ⚠️"` | percentage
ONE notification per run. Never before validation passes.

---

## 10. ENVIRONMENT REQUIREMENTS

```
GEMINI_API_KEY  →  Windows User env var (never in code, never in git)
Python 3.11+    →  google-genai, yfinance, requests, urllib3
Git             →  push access to https://github.com/shalevgigi-VKS/Chadshani
```
