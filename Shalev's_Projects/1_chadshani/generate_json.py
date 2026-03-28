"""
Chadshani 2.0 — News Generator
Uses Gemini API (free tier) with Google Search grounding.
Outputs data/latest.json in the exact schema the website expects.
"""

import os
import json
import re
import sys
from datetime import datetime
from google import genai
from google.genai import types
import yfinance as yf

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not set")
    sys.exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """אתה "חדשני" — דסק חדשות מודיעיני פיננסי-טכנולוגי בכיר.
שפה: עברית בלבד. חריגים: טיקרים, שמות חברות, שמות מוצרים רשמיים.
סגנון: אנליטי, צפוף, מעמיק. אין להמציא מידע מספרי.

כללי אמת מחמירים:
- אסור להמציא שמות מוצרים, שמות קוד, גרסאות, מודלים, או הכרזות שלא אומתו במקור ידועה.
- אסור לייצר "חדשות" שלא מבוססות על מקור שחיפשת. אם אין מידע — כתוב את המצב הידוע האחרון.
- section_7_ai: כתוב אך ורק מוצרים ומודלים שהוכרזו רשמית. אין שמות קוד בדויים.
- ספק מידע עובדתי בלבד. ספקולציות יסומנו במפורש כ"לפי דיווחים" או "צפוי".
"""

JSON_PROMPT = """
חפש את החדשות העדכניות ביותר ב-24 השעות האחרונות והפק תשובה JSON בלבד (ללא markdown, ללא ```).

הפורמט המדויק הנדרש:
{
  "generated_at": "[ISO timestamp]Z",
  "section_1_situation": {
    "headline": "משפט אחד — תמונת מצב מרכזית של השוק היום",
    "analysis": "פסקה קצרה — Risk-on/Risk-off, כוח מניע, סנטימנט",
    "cards": [
      {"label": "מיקוד הוני", "value": "..."},
      {"label": "גורמי חיכוך", "value": "..."},
      {"label": "סביבת מסחר", "value": "..."}
    ],
    "alert": {
      "title": "התרעת מעקב קריטית",
      "value": "[סכום/ערך מרכזי]",
      "description": "[תיאור קצר של האירוע]",
      "impact": "HIGH / MEDIUM / LOW VOLATILITY"
    },
    "gauges": {
      "vix": {"value": "X.X", "zone": "low/medium/high/extreme", "label": "תיאור מצב VIX"},
      "fear_greed_stock": {"value": "XX", "label": "שם המצב בעברית", "zone": "extreme_fear/fear/neutral/greed/extreme_greed"},
      "fear_greed_crypto": {"value": "XX", "label": "שם המצב בעברית", "zone": "extreme_fear/fear/neutral/greed/extreme_greed"}
    }
  },
  "section_2_news": [
    {"title": "כותרת חדשה 1", "body": "פסקה מנותחת", "so_what": "משמעות למשקיע"},
    {"title": "כותרת חדשה 2", "body": "פסקה מנותחת", "so_what": "משמעות למשקיע"},
    {"title": "כותרת חדשה 3", "body": "פסקה מנותחת", "so_what": "משמעות למשקיע"},
    {"title": "כותרת חדשה 4", "body": "פסקה מנותחת", "so_what": "משמעות למשקיע"},
    {"title": "כותרת חדשה 5", "body": "פסקה מנותחת", "so_what": "משמעות למשקיע"},
    {"title": "כותרת חדשה 6", "body": "פסקה מנותחת", "so_what": "משמעות למשקיע"}
  ],
  "section_3_sectors": [
    {"etf": "XLK", "name": "טכנולוגיה", "change": "+X.X%", "flow": "Inflow/Outflow/נייטרלי", "note": "סיבה"},
    {"etf": "XLV", "name": "בריאות", "change": "+X.X%", "flow": "...", "note": "..."},
    {"etf": "XLU", "name": "תשתיות", "change": "+X.X%", "flow": "...", "note": "..."},
    {"etf": "XLF", "name": "פיננסים", "change": "+X.X%", "flow": "...", "note": "..."},
    {"etf": "XLE", "name": "אנרגיה", "change": "+X.X%", "flow": "...", "note": "..."},
    {"etf": "XLY", "name": "צריכה מחזורית", "change": "+X.X%", "flow": "...", "note": "..."},
    {"etf": "XLI", "name": "תעשייה", "change": "+X.X%", "flow": "...", "note": "..."},
    {"etf": "XLB", "name": "חומרי גלם", "change": "+X.X%", "flow": "...", "note": "..."},
    {"etf": "XLRE", "name": "נדל\"ן", "change": "+X.X%", "flow": "...", "note": "..."},
    {"etf": "XLP", "name": "צריכה בסיסית", "change": "+X.X%", "flow": "...", "note": "..."},
    {"etf": "XLC", "name": "תקשורת", "change": "+X.X%", "flow": "...", "note": "..."}
  ],
  "section_3_capital_flow": [
    {"label": "טכנולוגיה (תשתיות AI)", "amount": "+$X.XB", "direction": "in"},
    {"label": "בריאות (GLP-1 / Biotech)", "amount": "+$X.XB", "direction": "in"},
    {"label": "אנרגיה (גרעין/SMR)", "amount": "+$X.XB", "direction": "in"},
    {"label": "פיננסים (בנקים גדולים)", "amount": "+$X.XB", "direction": "in"},
    {"label": "תשתיות (Data Centers)", "amount": "+$X.XB", "direction": "in"},
    {"label": "ביטחון / Aerospace", "amount": "+$X.XB", "direction": "in"},
    {"label": "צריכה מחזורית", "amount": "-$X.XB", "direction": "out"},
    {"label": "נדל\"ן מסחרי", "amount": "-$X.XB", "direction": "out"},
    {"label": "קמעונאות מסורתית", "amount": "-$X.XB", "direction": "out"},
    {"label": "תקשורת / Media", "amount": "-$X.XB", "direction": "out"},
    {"label": "חומרי גלם", "amount": "-$X.XB", "direction": "out"}
  ],
  "section_4_crypto": [
    {"ticker": "BTC", "price": "$...", "change_24h": "+X.X%", "note": "..."},
    {"ticker": "ETH", "price": "$...", "change_24h": "+X.X%", "note": "..."},
    {"ticker": "SOL", "price": "$...", "change_24h": "+X.X%", "note": "..."},
    {"ticker": "LINK", "price": "$...", "change_24h": "+X.X%", "note": "..."}
  ],
  "section_4_crypto_brief": {
    "daily_narrative": "סיפור היום בקריפטו — מה הניע את השוק, אירועים מרכזיים, נרטיב מלא (לפחות 3-4 משפטים)",
    "smart_money": "זרימת הכסף החכם — מה המוסדיים עושים, ETF flows, futures positions",
    "whale_activity": "פעילות לוויתנים — העברות גדולות, ריכוז ארנקים, on-chain signals",
    "conclusion": "מסקנה ותזה — מה המשמעות למשקיע, מה לעקוב"
  },
  "section_5_semis": [
    {"ticker": "NVDA", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "TSM", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "AMD", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "AVGO", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "MU", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "ASML", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "QCOM", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "ARM", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "MRVL", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "LRCX", "price": "$...", "change": "+X.X%", "note": "..."}
  ],
  "section_6_software": [
    {"ticker": "MSFT", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "GOOGL", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "META", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "AMZN", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "CRM", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "NOW", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "ORCL", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "ADBE", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "PLTR", "price": "$...", "change": "+X.X%", "note": "..."},
    {"ticker": "SNOW", "price": "$...", "change": "+X.X%", "note": "..."}
  ],
  "section_7_ai": [
    {"company": "OpenAI", "product": "GPT-4o / o3", "brief": "פסקה מפורטת של לפחות 4 משפטים על המצב הנוכחי: מה השתנה לאחרונה, capabilities חדשות, עדכוני API, שינויי תמחור, מיקום תחרותי, אירועים אחרונים. אם לא השתנה כלום — תאר את המצב הנוכחי הידוע.", "last_known_update": "תאריך או 'אין עדכון חדש'", "status": "GA/Beta"},
    {"company": "Google/Gemini", "product": "Gemini 2.x", "brief": "...", "last_known_update": "...", "status": "GA/Beta"},
    {"company": "Anthropic/Claude", "product": "Claude 3.x / 4.x", "brief": "...", "last_known_update": "...", "status": "GA/Beta"},
    {"company": "Meta/Llama", "product": "Llama 4.x", "brief": "...", "last_known_update": "...", "status": "GA/Beta"},
    {"company": "xAI/Grok", "product": "Grok 3.x", "brief": "...", "last_known_update": "...", "status": "GA/Beta"},
    {"company": "Perplexity", "product": "Perplexity AI", "brief": "...", "last_known_update": "...", "status": "GA/Beta"}
  ],
  "section_8_conclusion": {
    "thesis": "תזת ההשקעה הדומיננטית — פסקה מנותחת",
    "risks": "סיכונים עיקריים — פסקה מנותחת",
    "opportunities": "הזדמנויות ספציפיות לשבוע הקרוב",
    "action": "משפט מסכם — מה הפעולה הנכונה עכשיו"
  },
  "section_8_watchlist": [
    {"ticker": "NVDA", "note": "CoWoS-L Supply Chain"},
    {"ticker": "TSM", "note": "2nm Performance Hub"},
    {"ticker": "VRT", "note": "Cooling & Grid Infra"},
    {"ticker": "MSTR", "note": "Crypto High Beta"},
    {"ticker": "SOL", "note": "Firedancer Catalyst"},
    {"ticker": "MU", "note": "HBM4 Market Share"},
    {"ticker": "PLTR", "note": "AI Government Contracts"},
    {"ticker": "ARM", "note": "Custom Silicon Royalties"},
    {"ticker": "LINK", "note": "DeFi Oracle Leader"},
    {"ticker": "AVGO", "note": "AI Networking ASIC"}
  ]
}

כללים קריטיים:
- שדות price ו-change_24h: מחירים ושינויים יסופקו מ-yfinance לאחר מכן — כתוב "לא זמין" כ-placeholder בלבד.
- שדות note, so_what, body, analysis, brief, thesis, risks, opportunities, action, flow, daily_narrative, smart_money, whale_activity, conclusion: חייבים להכיל טקסט אנליטי ממשי — אסור לכתוב "לא זמין".
- section_7_ai brief: חייב להיות לפחות 4 משפטים לכל חברה. אם אין עדכון חדש — תאר את המצב הידוע הנוכחי.
- section_4_crypto_brief: כל שדה חייב להיות לפחות 2-3 משפטים עם מידע ממשי.
- section_1_situation gauges: חפש את ערכי CNN Fear & Greed ו-Crypto Fear & Greed האחרונים דרך Google Search. VIX יוחלף אוטומטית על ידי yfinance.
- gauges zone: "extreme_fear" (0-24) / "fear" (25-44) / "neutral" (45-54) / "greed" (55-74) / "extreme_greed" (75-100) עבור F&G. VIX zone: "low" (<15) / "medium" (15-20) / "high" (20-30) / "extreme" (>30).
- section_3_capital_flow amounts: הערך ב-$XB פורמט — אמוד לפי סנטימנט הסקטור.
- section_3_sectors flow: "Inflow" / "Outflow" / "נייטרלי" בלבד.
- generated_at: timestamp ISO עכשווי בדיוק עם Z בסיום.
- section_8_watchlist: בחר 10 טיקרים רלוונטיים לשבוע הקרוב לפי החדשות שמצאת.
- החזר JSON בלבד. אין טקסט לפני או אחרי.
"""

MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"]

# Crypto ticker mapping: JSON ticker → yfinance symbol
CRYPTO_MAP = {"BTC": "BTC-USD", "ETH": "ETH-USD", "SOL": "SOL-USD", "LINK": "LINK-USD"}

# Market indices: yfinance symbol → JSON key
MARKET_SYMBOLS = {"^GSPC": "sp500", "^NDX": "nasdaq", "^TNX": "yield_10y", "^DJI": "dji", "^VIX": "vix", "GC=F": "gold", "SI=F": "silver", "CL=F": "oil", "BTC-USD": "btc", "ETH-USD": "eth", "DX-Y.NYB": "dxy"}


def fetch_prices(symbols):
    """Fetch last price and daily change% for a list of yfinance symbols.
    Returns dict: symbol → (price_float, change_pct_float)
    """
    result = {}
    if not symbols:
        return result
    try:
        data = yf.download(list(symbols), period="2d", interval="1d",
                           auto_adjust=True, progress=False, threads=True)
        close = data["Close"]
        for sym in symbols:
            try:
                col = close[sym] if sym in close.columns else close
                prices = col.dropna()
                if len(prices) >= 2:
                    p_now, p_prev = float(prices.iloc[-1]), float(prices.iloc[-2])
                    result[sym] = (p_now, (p_now - p_prev) / p_prev * 100)
                elif len(prices) == 1:
                    result[sym] = (float(prices.iloc[-1]), 0.0)
            except Exception:
                pass
    except Exception as e:
        print(f"[PRICE WARN] batch fetch failed: {e}")
    return result


def fmt_price(p, is_crypto=False):
    if p >= 1000:
        return f"${p:,.2f}"
    if p >= 1:
        return f"${p:.2f}"
    return f"${p:.4f}"


def fmt_change(c):
    sign = "+" if c >= 0 else ""
    return f"{sign}{c:.2f}%"


def patch_prices(data):
    """Replace 'לא זמין' / placeholder prices with real yfinance data."""
    # Collect all symbols needed
    stock_symbols = set()
    for section in ("section_3_sectors", "section_5_semis", "section_6_software"):
        for item in data.get(section, []):
            sym = item.get("etf") or item.get("ticker")
            if sym:
                stock_symbols.add(sym)

    crypto_symbols = set()
    for item in data.get("section_4_crypto", []):
        sym = CRYPTO_MAP.get(item.get("ticker", ""))
        if sym:
            crypto_symbols.add(sym)

    # Fetch
    stock_prices = fetch_prices(stock_symbols)
    crypto_prices = fetch_prices(crypto_symbols)

    # Patch section_3_sectors
    for item in data.get("section_3_sectors", []):
        sym = item.get("etf")
        if sym and sym in stock_prices:
            p, c = stock_prices[sym]
            item["change"] = fmt_change(c)

    # Patch section_5_semis and section_6_software
    for section in ("section_5_semis", "section_6_software"):
        for item in data.get(section, []):
            sym = item.get("ticker")
            if sym and sym in stock_prices:
                p, c = stock_prices[sym]
                item["price"] = fmt_price(p)
                item["change"] = fmt_change(c)

    # Patch section_4_crypto
    for item in data.get("section_4_crypto", []):
        yf_sym = CRYPTO_MAP.get(item.get("ticker", ""))
        if yf_sym and yf_sym in crypto_prices:
            p, c = crypto_prices[yf_sym]
            item["price"] = fmt_price(p, is_crypto=True)
            item["change_24h"] = fmt_change(c)

    # Fetch and add market indices (S&P, Nasdaq, 10Y yield)
    market_prices = fetch_prices(set(MARKET_SYMBOLS.keys()))
    markets = {}
    for yf_sym, key in MARKET_SYMBOLS.items():
        if yf_sym in market_prices:
            p, c = market_prices[yf_sym]
            if key == "yield_10y":
                markets[key] = {"value": f"{p:.2f}%", "change": fmt_change(c)}
            elif key == "vix":
                markets[key] = {"value": f"{p:.2f}", "change": fmt_change(c)}
            elif key in ("gold", "silver"):
                markets[key] = {"price": fmt_price(p), "change": fmt_change(c)}
            else:
                markets[key] = {"price": fmt_price(p), "change": fmt_change(c)}
    if markets:
        data["markets"] = markets

    # Overwrite VIX value from yfinance (more accurate than Gemini estimate)
    if "vix" in markets and data.get("section_1_situation", {}).get("gauges", {}).get("vix"):
        data["section_1_situation"]["gauges"]["vix"]["value"] = markets["vix"]["value"]

    print(f"[PRICES] patched {len(stock_prices)} stocks + {len(crypto_prices)} crypto + {len(market_prices)} indices")
    return data


def validate(data):
    """Returns list of critical missing fields. Empty list = pass."""
    issues = []
    # Numeric price fields must not be 'לא זמין'
    for item in data.get("section_5_semis", []):
        if item.get("price") in ("לא זמין", "$...", None):
            issues.append(f"semis {item.get('ticker')} price missing")
    for item in data.get("section_6_software", []):
        if item.get("price") in ("לא זמין", "$...", None):
            issues.append(f"software {item.get('ticker')} price missing")
    for item in data.get("section_4_crypto", []):
        if item.get("price") in ("לא זמין", "$...", None):
            issues.append(f"crypto {item.get('ticker')} price missing")
    # Required sections must be present and non-empty
    for section, min_items in [("section_2_news", 4), ("section_3_sectors", 11),
                                ("section_5_semis", 10), ("section_6_software", 10),
                                ("section_7_ai", 4), ("section_8_watchlist", 8)]:
        count = len(data.get(section, []))
        if count < min_items:
            issues.append(f"{section} has {count} items (need {min_items})")
    # Markets block must exist
    if not data.get("markets"):
        issues.append("markets block missing")
    return issues

def clean_raw(raw):
    """Strip markdown fences and control characters from Gemini output."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    # Strip control chars except \t (0x09) which is valid JSON whitespace
    raw = re.sub(r'[\x00-\x08\x0a-\x1f\x7f]', '', raw)
    # Strip Unicode directional/invisible marks
    raw = re.sub(r'[\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]', '', raw)
    return raw


# ── Gemini pricing (per 1M tokens, USD) ──────────────────────────────────────
# Flash 2.5: input $0.075 / output $0.30 / search grounding $35 per 1K requests
# Pro   2.5: input $1.25  / output $10.00 / search grounding $35 per 1K requests
_PRICING = {
    "gemini-2.5-flash": {"in": 0.075, "out": 0.30,  "search": 35.0},
    "gemini-2.5-pro":   {"in": 1.25,  "out": 10.00, "search": 35.0},
}
USD_TO_ILS = 3.65   # approximate; update if needed
COST_LOG = os.path.join(os.path.dirname(__file__), "data", "cost_log.json")


def _load_cost_log():
    if os.path.exists(COST_LOG):
        with open(COST_LOG, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"runs": [], "total_usd": 0.0, "total_ils": 0.0}


def _save_cost_log(log):
    with open(COST_LOG, "w", encoding="utf-8") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)


def log_cost(model, usage):
    """Calculate cost from usage_metadata and append to cost_log.json."""
    try:
        p = _PRICING.get(model, _PRICING["gemini-2.5-flash"])
        in_tok  = getattr(usage, "prompt_token_count", 0) or 0
        out_tok = getattr(usage, "candidates_token_count", 0) or 0
        cost_usd = (in_tok / 1_000_000 * p["in"] +
                    out_tok / 1_000_000 * p["out"] +
                    1 / 1000 * p["search"])   # 1 grounding call per run
        cost_ils = cost_usd * USD_TO_ILS
        log = _load_cost_log()
        log["runs"].append({
            "ts": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "model": model,
            "in_tokens": in_tok,
            "out_tokens": out_tok,
            "cost_usd": round(cost_usd, 5),
            "cost_ils": round(cost_ils, 4),
        })
        log["total_usd"] = round(log["total_usd"] + cost_usd, 5)
        log["total_ils"] = round(log["total_ils"] + cost_ils, 4)
        _save_cost_log(log)
        print(f"[COST] run=${cost_usd:.5f} / ₪{cost_ils:.4f} | "
              f"total=${log['total_usd']:.4f} / ₪{log['total_ils']:.3f} "
              f"(budget ₪20.00 — {log['total_ils']/20*100:.1f}% used)")
    except Exception as e:
        print(f"[COST] tracking error: {e}")


def call_gemini(model, attempt):
    print(f"[TRY] model={model} attempt={attempt+1}")
    response = client.models.generate_content(
        model=model,
        contents=JSON_PROMPT,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.3,
            max_output_tokens=16384,
            tools=[types.Tool(google_search=types.GoogleSearch())],
        ),
    )
    if hasattr(response, "usage_metadata"):
        log_cost(model, response.usage_metadata)
    return response


def generate():
    import time
    data = None
    for model in MODELS:
        for attempt in range(3):
            try:
                response = call_gemini(model, attempt)
                raw = clean_raw(response.text)
                candidate = json.loads(raw)
                candidate = patch_prices(candidate)
                issues = validate(candidate)
                if issues:
                    print(f"[WARN] Validation failed attempt {attempt+1}: {issues[:3]}")
                    if attempt < 2:
                        time.sleep(10)
                    continue
                data = candidate
                print(f"[OK] JSON parsed and validated — model={model}")
                break
            except json.JSONDecodeError as e:
                print(f"[WARN] Invalid JSON attempt {attempt+1}: {e} — retrying")
                if attempt < 2:
                    time.sleep(10)
            except Exception as e:
                print(f"[WARN] API error attempt {attempt+1}: {e}")
                if attempt < 2:
                    time.sleep(15)
        if data is not None:
            break
        print(f"[SKIP] {model} failed after 3 attempts")
    if data is None:
        print("ERROR: All models and attempts exhausted")
        sys.exit(1)

    # Always set generated_at to now
    data["generated_at"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    output_path = os.path.join(os.path.dirname(__file__), "data", "latest.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[OK] latest.json written — {data['generated_at']}")

if __name__ == "__main__":
    generate()
