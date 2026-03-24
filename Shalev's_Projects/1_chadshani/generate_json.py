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
    {"company": "OpenAI", "product": "...", "update": "...", "status": "GA/Beta"},
    {"company": "Google/Gemini", "product": "...", "update": "...", "status": "GA/Beta"},
    {"company": "Anthropic/Claude", "product": "...", "update": "...", "status": "GA/Beta"},
    {"company": "Meta/Llama", "product": "...", "update": "...", "status": "GA/Beta"},
    {"company": "xAI/Grok", "product": "...", "update": "...", "status": "GA/Beta"},
    {"company": "Perplexity", "product": "...", "update": "...", "status": "GA/Beta"}
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
- שדות note, so_what, body, analysis, update, thesis, risks, opportunities, action, flow: חייבים להכיל טקסט אנליטי ממשי — אסור לכתוב "לא זמין".
- section_3_capital_flow amounts: הערך ב-$XB פורמט — אמוד לפי סנטימנט הסקטור (לא חייב להיות מדויק, רק ריאלי).
- section_3_sectors flow: "Inflow" / "Outflow" / "נייטרלי" בלבד.
- generated_at: timestamp ISO עכשווי בדיוק עם Z בסיום.
- section_8_watchlist: בחר 10 טיקרים רלוונטיים לשבוע הקרוב לפי החדשות שמצאת.
- החזר JSON בלבד. אין טקסט לפני או אחרי.
"""

MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"]

# Crypto ticker mapping: JSON ticker → yfinance symbol
CRYPTO_MAP = {"BTC": "BTC-USD", "ETH": "ETH-USD", "SOL": "SOL-USD", "LINK": "LINK-USD"}

# Market indices: yfinance symbol → JSON key
MARKET_SYMBOLS = {"^GSPC": "sp500", "^NDX": "nasdaq", "^TNX": "yield_10y"}


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
            else:
                markets[key] = {"price": fmt_price(p), "change": fmt_change(c)}
    if markets:
        data["markets"] = markets

    print(f"[PRICES] patched {len(stock_prices)} stocks + {len(crypto_prices)} crypto + {len(market_prices)} indices")
    return data

def generate():
    import time
    last_err = None
    for model in MODELS:
        for attempt in range(3):
            try:
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
                break  # success
            except Exception as e:
                last_err = e
                print(f"[WARN] {e}")
                if attempt < 2:
                    time.sleep(15)
        else:
            print(f"[SKIP] {model} failed after 3 attempts")
            continue
        break  # model worked
    else:
        print(f"ERROR: All models failed. Last: {last_err}")
        sys.exit(1)

    raw = response.text.strip()
    # Strip markdown code fences if model added them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    # Remove ALL control characters (JSON escape sequences like \n are unaffected)
    raw = re.sub(r'[\x00-\x1f\x7f]', '', raw)

    # Validate JSON
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON from Gemini — {e}")
        print(f"Raw (first 300): {raw[:300]}")
        print(f"Raw (last 300): {raw[-300:]}")
        sys.exit(1)

    # Patch prices with real yfinance data
    data = patch_prices(data)

    # Always set generated_at to now
    data["generated_at"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    output_path = os.path.join(os.path.dirname(__file__), "data", "latest.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[OK] latest.json written — {data['generated_at']}")

if __name__ == "__main__":
    generate()
