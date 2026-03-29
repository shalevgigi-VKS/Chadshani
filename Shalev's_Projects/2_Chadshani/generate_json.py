"""
Chadshani 2.0 — News Generator
Uses Gemini API with free news context (yfinance.news + AI RSS feeds + Hacker News + Fear&Greed APIs).
No Google Search grounding — saves ~92% of API cost.
Outputs data/latest.json in the exact schema the website expects.
"""

import os
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
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
על בסיס חדשות השוק והנתונים שסופקו למעלה, הפק תשובה JSON בלבד (ללא markdown, ללא ```).

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
    {"etf": "XLK", "name": "טכנולוגיה", "change": "YFINANCE", "flow_direction": "in", "flow_amount": "+$3.2B", "note": "סיבה עיקרית — אנליזה קצרה"},
    {"etf": "XLV", "name": "בריאות", "change": "YFINANCE", "flow_direction": "in", "flow_amount": "+$1.8B", "note": "..."},
    {"etf": "XLU", "name": "תשתיות", "change": "YFINANCE", "flow_direction": "out", "flow_amount": "-$0.9B", "note": "..."},
    {"etf": "XLF", "name": "פיננסים", "change": "YFINANCE", "flow_direction": "in", "flow_amount": "+$2.1B", "note": "..."},
    {"etf": "XLE", "name": "אנרגיה", "change": "YFINANCE", "flow_direction": "out", "flow_amount": "-$1.3B", "note": "..."},
    {"etf": "XLY", "name": "צריכה מחזורית", "change": "YFINANCE", "flow_direction": "out", "flow_amount": "-$2.0B", "note": "..."},
    {"etf": "XLI", "name": "תעשייה", "change": "YFINANCE", "flow_direction": "in", "flow_amount": "+$1.1B", "note": "..."},
    {"etf": "XLB", "name": "חומרי גלם", "change": "YFINANCE", "flow_direction": "out", "flow_amount": "-$0.7B", "note": "..."},
    {"etf": "XLRE", "name": "נדל\"ן", "change": "YFINANCE", "flow_direction": "out", "flow_amount": "-$0.5B", "note": "..."},
    {"etf": "XLP", "name": "צריכה בסיסית", "change": "YFINANCE", "flow_direction": "neutral", "flow_amount": "$0.1B", "note": "..."},
    {"etf": "XLC", "name": "תקשורת", "change": "YFINANCE", "flow_direction": "in", "flow_amount": "+$1.5B", "note": "..."}
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
    {"company": "OpenAI", "product": "[שם המוצר הנוכחי לפי החדשות שסופקו]", "update": "[לפי החדשות שסופקו: השקות, עדכוני API, שינויי מחיר, שותפויות. אם אין — כתוב 'אין חדשות חדשות מהשבוע האחרון.' בלבד.]", "last_known_update": "[DD/MM/YYYY של החדשה האחרונה בחומר שסופק]", "status": "GA/Beta"},
    {"company": "Google/Gemini", "product": "[שם המוצר הנוכחי לפי החדשות שסופקו]", "update": "[לפי החדשות שסופקו בלבד.]", "last_known_update": "[DD/MM/YYYY]", "status": "GA/Beta"},
    {"company": "Anthropic/Claude", "product": "[שם המוצר הנוכחי לפי החדשות שסופקו]", "update": "[לפי החדשות שסופקו בלבד.]", "last_known_update": "[DD/MM/YYYY]", "status": "GA/Beta"},
    {"company": "Meta/Llama", "product": "[שם המוצר הנוכחי לפי החדשות שסופקו]", "update": "[לפי החדשות שסופקו בלבד.]", "last_known_update": "[DD/MM/YYYY]", "status": "GA/Beta"},
    {"company": "xAI/Grok", "product": "[שם המוצר הנוכחי לפי החדשות שסופקו]", "update": "[לפי החדשות שסופקו בלבד.]", "last_known_update": "[DD/MM/YYYY]", "status": "GA/Beta"},
    {"company": "Perplexity", "product": "[שם המוצר הנוכחי לפי החדשות שסופקו]", "update": "[לפי החדשות שסופקו בלבד.]", "last_known_update": "[DD/MM/YYYY]", "status": "GA/Beta"}
  ],
  "section_8_conclusion": {
    "thesis": "תזת ההשקעה הדומיננטית — פסקה מנותחת",
    "risks": "סיכונים עיקריים — פסקה מנותחת",
    "opportunities": "הזדמנויות ספציפיות לשבוע הקרוב",
    "action": "משפט מסכם — מה הפעולה הנכונה עכשיו"
  },
  "section_8_watchlist": {
    "rising": [
      {"ticker": "NVDA", "note": "למה לעקוב — מה הקטליסט", "signal": "BUY", "reason": "סיבה טכנית/פונדמנטלית לכניסה"},
      {"ticker": "TSM",  "note": "...", "signal": "BUY", "reason": "..."},
      {"ticker": "VRT",  "note": "...", "signal": "BUY", "reason": "..."},
      {"ticker": "PLTR", "note": "...", "signal": "BUY", "reason": "..."},
      {"ticker": "MU",   "note": "...", "signal": "BUY", "reason": "..."},
      {"ticker": "AVGO", "note": "...", "signal": "BUY", "reason": "..."}
    ],
    "falling": [
      {"ticker": "META", "note": "למה לעקוב — מה הקטליסט", "signal": "SELL", "reason": "סיבה טכנית/פונדמנטלית לכניסה"},
      {"ticker": "SNOW", "note": "...", "signal": "SELL", "reason": "..."},
      {"ticker": "ADBE", "note": "...", "signal": "SELL", "reason": "..."},
      {"ticker": "CRM",  "note": "...", "signal": "SELL", "reason": "..."},
      {"ticker": "MSTR", "note": "...", "signal": "SELL", "reason": "..."},
      {"ticker": "XLY",  "note": "...", "signal": "SELL", "reason": "..."}
    ]
  }
}

כללים קריטיים:
- שדות price ו-change_24h: מחירים ושינויים יסופקו מ-yfinance לאחר מכן — כתוב "לא זמין" כ-placeholder בלבד.
- שדות note, so_what, body, analysis, brief, thesis, risks, opportunities, action, flow, daily_narrative, smart_money, whale_activity, conclusion: חייבים להכיל טקסט אנליטי ממשי — אסור לכתוב "לא זמין".
- section_7_ai: עבור כל חברה — השתמש אך ורק בחדשות שסופקו למעלה. אסור להמציא שמות מוצרים, גרסאות, או תאריכים שאינם בחומר. אם אין מידע — כתוב "אין חדשות חדשות מהשבוע האחרון." ותו לא.
- section_7_ai product: מלא שם מוצר רק לפי מה שמופיע בחומר שסופק. אל תמציא.
- section_4_crypto_brief: כל שדה חייב להיות לפחות 2-3 משפטים עם מידע ממשי.
- section_1_situation gauges: ערכי Fear & Greed יסופקו בפרומפט — השתמש בהם בדיוק. VIX יוחלף אוטומטית על ידי yfinance.
- gauges zone: "extreme_fear" (0-24) / "fear" (25-44) / "neutral" (45-54) / "greed" (55-74) / "extreme_greed" (75-100) עבור F&G. VIX zone: "low" (<15) / "medium" (15-20) / "high" (20-30) / "extreme" (>30).
- section_3_sectors flow_amount: חובה להחליף בסכום ממשי (לדוגמה: "+$3.2B", "-$1.8B", "$0.1B"). אסור להשאיר "X.X" — זה placeholder בלבד לצורך הדוגמה. אמוד לפי סנטימנט הסקטור ביום זה.
- section_3_sectors change: שדה change יוחלף אוטומטית על ידי yfinance — כתוב "YFINANCE" בלבד.
- generated_at: timestamp ISO עכשווי בדיוק עם Z בסיום.
- section_8_watchlist: בחר 6 טיקרים עם פוטנציאל עלייה (rising) ו-6 עם פוטנציאל ירידה (falling) לשבוע הקרוב. לכל טיקר: note (למה לעקוב, מה הקטליסט), signal (BUY/SELL), reason (סיבה טכנית/פונדמנטלית קצרה ומדויקת). בחר לפי החדשות שמצאת בלבד.
- החזר JSON בלבד. אין טקסט לפני או אחרי.
"""

# Models: flash (2 attempts) → pro (1 attempt, expensive last resort)
# Defined inline in generate() as MODEL_ATTEMPTS

# Crypto ticker mapping: JSON ticker → yfinance symbol
CRYPTO_MAP = {"BTC": "BTC-USD", "ETH": "ETH-USD", "SOL": "SOL-USD", "LINK": "LINK-USD"}

# Market indices: yfinance symbol → JSON key
MARKET_SYMBOLS = {"^GSPC": "sp500", "^NDX": "nasdaq", "^TNX": "yield_10y", "^DJI": "dji", "^VIX": "vix", "GC=F": "gold", "SI=F": "silver", "CL=F": "oil", "BTC-USD": "btc", "ETH-USD": "eth", "DX-Y.NYB": "dxy"}

# Tickers to fetch news for (covers all major tracked companies + sector ETFs)
NEWS_TICKERS = [
    "NVDA", "MSFT", "GOOGL", "META", "AMZN", "AAPL",
    "AMD", "TSM", "AVGO", "MU", "ASML", "QCOM", "ARM", "MRVL", "LRCX",
    "CRM", "NOW", "ORCL", "ADBE", "PLTR", "SNOW",
    "XLK", "XLF", "XLE", "XLY", "XLV", "XLU",
    "BTC-USD", "ETH-USD",
]


def fetch_fear_greed():
    """Fetch Fear & Greed indices from free APIs — no API key required."""
    result = {"stock": None, "crypto": None}
    try:
        req = urllib.request.Request(
            "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Origin": "https://edition.cnn.com",
                "Referer": "https://edition.cnn.com/markets/fear-and-greed",
            }
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            d = json.loads(r.read())
            result["stock"] = int(d["fear_and_greed"]["score"])
    except Exception as e:
        print(f"[WARN] CNN F&G: {e}")
    try:
        with urllib.request.urlopen("https://api.alternative.me/fng/?limit=1", timeout=8) as r:
            d = json.loads(r.read())
            result["crypto"] = int(d["data"][0]["value"])
    except Exception as e:
        print(f"[WARN] Crypto F&G: {e}")
    return result


def fetch_yfinance_news_batch(tickers, max_per=2):
    """Fetch recent news headlines from yfinance for a list of tickers."""
    items = []
    seen = set()
    for sym in tickers:
        try:
            news = yf.Ticker(sym).news or []
            count = 0
            for item in news:
                # yfinance ≥0.2.54 wraps content under item["content"]
                content = item.get("content") or item
                title = (content.get("title") or item.get("title") or "").strip()
                summary = (content.get("summary") or content.get("description")
                           or item.get("summary") or item.get("description") or "").strip()
                if title and title not in seen and count < max_per:
                    seen.add(title)
                    line = f"[{sym}] {title}"
                    if summary:
                        line += f": {summary[:220]}"
                    items.append(line)
                    count += 1
        except Exception as e:
            print(f"[WARN] yf.news {sym}: {e}")
    return items


_AI_RSS_FEEDS = [
    # (label, url, item_tag, title_tag, desc_tag)
    ("TechCrunch AI",  "https://techcrunch.com/category/artificial-intelligence/feed/", "item",  "title", "description"),
    ("VentureBeat AI", "https://venturebeat.com/category/ai/feed/",                     "item",  "title", "description"),
    ("The Verge",      "https://www.theverge.com/rss/index.xml",                        "entry", "title", "summary"),
    ("ArsTechnica",    "https://feeds.arstechnica.com/arstechnica/index",               "item",  "title", "description"),
]

_AI_KEYWORDS = {
    "openai", "anthropic", "claude", "gemini", "gpt", "llama", "grok", "mistral",
    "deepmind", "copilot", "sora", "chatgpt", "perplexity", "xai", "llm", "ai model",
    "language model", "foundation model", "generative ai", "artificial intelligence",
}


def _clean_rss_xml(raw: bytes) -> bytes:
    """Strip namespace prefixes and declarations so ElementTree can parse any RSS/Atom feed."""
    # Remove prefixed tags: <ns:tag> → <tag>
    raw = re.sub(rb'<(/?)[\w][\w]*:([\w])', rb'<\1\2', raw)
    # Remove prefixed attributes: ns:attr="val"
    raw = re.sub(rb'\s[\w][\w]*:[\w][^=>\s]+=(?:"[^"]*"|\'[^\']*\')', b'', raw)
    # Remove xmlns declarations
    raw = re.sub(rb'\s+xmlns(?::[^=]+)?="[^"]*"', b'', raw)
    return raw


def fetch_ai_rss(max_per_feed=4):
    """Fetch recent headlines from AI-focused RSS feeds — no API key required."""
    items = []
    seen = set()
    for label, url, item_tag, title_tag, desc_tag in _AI_RSS_FEEDS:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; Chadshani/2.0)"},
            )
            with urllib.request.urlopen(req, timeout=10) as r:
                raw = r.read()
            root = ET.fromstring(_clean_rss_xml(raw))
            count = 0
            for el in root.iter(item_tag):
                title_el = el.find(title_tag)
                desc_el = el.find(desc_tag)
                title = (title_el.text or "").strip() if title_el is not None else ""
                desc = (desc_el.text or "").strip() if desc_el is not None else ""
                desc = re.sub(r"<[^>]+>", "", desc)[:200]
                if title and title not in seen and count < max_per_feed:
                    seen.add(title)
                    line = f"[{label}] {title}"
                    if desc:
                        line += f": {desc}"
                    items.append(line)
                    count += 1
            print(f"[RSS] {label}: {count} items")
        except Exception as e:
            print(f"[WARN] RSS {label}: {e}")
    print(f"[RSS] total: {len(items)} AI items from {len(_AI_RSS_FEEDS)} feeds")
    return items


def fetch_hn_news(max_items=15):
    """Fetch Hacker News stories filtered for AI/tech relevance — free, no key."""
    stories = []
    ai_kw = _AI_KEYWORDS
    try:
        with urllib.request.urlopen(
            "https://hacker-news.firebaseio.com/v0/topstories.json", timeout=8
        ) as r:
            ids = json.loads(r.read())[:60]  # scan top 60 to find AI-relevant ones
        collected = 0
        for sid in ids:
            if collected >= max_items:
                break
            try:
                with urllib.request.urlopen(
                    f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=5
                ) as r:
                    item = json.loads(r.read())
                    title = (item.get("title") or "").strip()
                    if title:
                        title_lower = title.lower()
                        # Prioritise AI-related stories; always include if we need to fill
                        is_ai = any(kw in title_lower for kw in ai_kw)
                        if is_ai or collected < 5:
                            stories.append(f"• {title}")
                            collected += 1
            except Exception:
                pass
    except Exception as e:
        print(f"[WARN] HN fetch: {e}")
    return stories


def build_news_context():
    """Aggregate free market data into a context string + Fear&Greed dict."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    lines = [f"=== נתוני שוק לניתוח — {today} ===\n"]

    fg = fetch_fear_greed()
    if fg["stock"] is not None or fg["crypto"] is not None:
        lines.append("=== Fear & Greed Indices ===")
        if fg["stock"] is not None:
            lines.append(f"Stock Market Fear & Greed Index: {fg['stock']}/100")
        if fg["crypto"] is not None:
            lines.append(f"Crypto Fear & Greed Index: {fg['crypto']}/100")
        lines.append("")

    ai_rss = fetch_ai_rss(max_per_feed=4)
    if ai_rss:
        lines.append("=== חדשות AI — RSS (TechCrunch/VentureBeat/TheVerge/ArsTechnica) ===")
        lines.extend(ai_rss)
        lines.append("")

    stock_news = fetch_yfinance_news_batch(NEWS_TICKERS, max_per=2)
    if stock_news:
        lines.append("=== חדשות מניות וסקטורים (yfinance) ===")
        lines.extend(stock_news[:50])
        lines.append("")

    hn_news = fetch_hn_news(max_items=15)
    if hn_news:
        lines.append("=== חדשות AI וטכנולוגיה (Hacker News) ===")
        lines.extend(hn_news)
        lines.append("")

    context = "\n".join(lines)
    print(f"[CONTEXT] {len(context)} chars | {len(ai_rss)} RSS | {len(stock_news)} stock | {len(hn_news)} HN | F&G={fg}")
    return context, fg


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


def fetch_crypto_price(yf_sym):
    """Fetch crypto price and 24h change using fast_info (lastPrice / previousClose).
    Avoids the partial-candle problem that causes 0.00% change with daily interval."""
    try:
        fi = yf.Ticker(yf_sym).fast_info
        price = fi.get("lastPrice") or fi.get("last_price")
        prev  = fi.get("previousClose") or fi.get("previous_close")
        if price and prev and prev > 0:
            return float(price), (float(price) - float(prev)) / float(prev) * 100
        # Fallback: try history with 5d period to guarantee 2 complete candles
        hist = yf.Ticker(yf_sym).history(period="5d", interval="1d")
        hist = hist["Close"].dropna()
        if len(hist) >= 2:
            p_now, p_prev = float(hist.iloc[-1]), float(hist.iloc[-2])
            return p_now, (p_now - p_prev) / p_prev * 100
    except Exception as e:
        print(f"[PRICE WARN] crypto {yf_sym}: {e}")
    return None, 0.0


def patch_prices(data):
    """Replace 'לא זמין' / placeholder prices with real yfinance data."""
    # Collect all symbols needed
    stock_symbols = set()
    for section in ("section_3_sectors", "section_5_semis", "section_6_software"):
        for item in data.get(section, []):
            sym = item.get("etf") or item.get("ticker")
            if sym:
                stock_symbols.add(sym)

    # Fetch stocks (batch download — works reliably for exchange-traded assets)
    stock_prices = fetch_prices(stock_symbols)

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

    # Patch section_4_crypto — use fast_info to get true 24h change
    for item in data.get("section_4_crypto", []):
        yf_sym = CRYPTO_MAP.get(item.get("ticker", ""))
        if not yf_sym:
            continue
        p, c = fetch_crypto_price(yf_sym)
        if p is not None:
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

    crypto_count = len(data.get("section_4_crypto", []))
    print(f"[PRICES] patched {len(stock_prices)} stocks + {crypto_count} crypto + {len(market_prices)} indices")
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
                                ("section_7_ai", 4)]:
        count = len(data.get(section, []))
        if count < min_items:
            issues.append(f"{section} has {count} items (need {min_items})")
    # Watchlist: {rising:[], falling:[]} — each must have 6 items
    wl = data.get("section_8_watchlist", {})
    if isinstance(wl, dict):
        for side in ("rising", "falling"):
            count = len(wl.get(side, []))
            if count < 6:
                issues.append(f"section_8_watchlist.{side} has {count} items (need 6)")
    else:
        issues.append("section_8_watchlist must be an object with rising/falling arrays")
    # Sector flow_amount must not contain placeholder "X.X"
    for s in data.get("section_3_sectors", []):
        amt = s.get("flow_amount", "")
        if "X.X" in amt or amt in ("", None):
            issues.append(f"section_3_sectors {s.get('etf')} flow_amount is placeholder: {amt!r}")
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
# Flash 2.5: input $0.075 / output $0.30
# Pro   2.5: input $1.25  / output $10.00
# Note: Google Search grounding removed — news fetched via yfinance + HN (free)
# Savings: ~$0.035/run × 3/day × 30 = ~100 ILS/month eliminated
_PRICING = {
    "gemini-2.5-flash": {"in": 0.075, "out": 0.30},
    "gemini-2.5-pro":   {"in": 1.25,  "out": 10.00},
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
                    out_tok / 1_000_000 * p["out"])
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


def call_gemini(model, attempt, news_context, fear_greed):
    print(f"[TRY] model={model} attempt={attempt+1}")
    today = datetime.utcnow().strftime("%Y-%m-%d")

    fg_note = ""
    if fear_greed.get("stock") is not None:
        fg_note += (f"\nStock Fear & Greed: {fear_greed['stock']}/100 — "
                    f"השתמש בערך זה בדיוק ב-section_1_situation.gauges.fear_greed_stock.value")
    if fear_greed.get("crypto") is not None:
        fg_note += (f"\nCrypto Fear & Greed: {fear_greed['crypto']}/100 — "
                    f"השתמש בערך זה בדיוק ב-section_1_situation.gauges.fear_greed_crypto.value")

    full_prompt = (
        f"היום: {today}.\n"
        f"החדשות והנתונים הבאים נאספו עכשיו ממקורות חינמיים:\n\n"
        f"{news_context}"
        f"{fg_note}\n\n"
        "הוראה קריטית: השתמש אך ורק בנתונים שסופקו למעלה. "
        "אסור להמציא חדשות שאינן בחומר. "
        "אם אין מידע על חברה — כתוב 'אין חדשות חדשות מהשבוע האחרון.' בלבד.\n\n"
        + JSON_PROMPT
    )

    response = client.models.generate_content(
        model=model,
        contents=full_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.3,
            max_output_tokens=16384,
            # No google_search tool — news fetched via free sources
        ),
    )
    if hasattr(response, "usage_metadata"):
        log_cost(model, response.usage_metadata)
    return response


_CONTENT_PLACEHOLDERS = {
    "אין חדשות חדשות מהשבוע האחרון.", "אין חדשות חדשות מהשבוע האחרון",
    "עדכון ידוע: לא זמין", "לא זמין", "לא זמין.", "אין עדכון", "",
}


def _load_previous():
    """Load the last written latest.json, or return empty dict."""
    path = os.path.join(os.path.dirname(__file__), "data", "latest.json")
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def merge_with_previous(data, prev):
    """
    For every section item where summary/update/note contains a placeholder,
    replace the item with the matching entry from the previous run.
    This prevents 'אין חדשות' from ever reaching the live site.
    """
    if not prev:
        return data

    def _is_placeholder(text):
        if not text:
            return True
        t = str(text).strip()
        return t in _CONTENT_PLACEHOLDERS or "אין חדשות" in t or "לא זמין" in t

    # section_2_news — match by title (news items use body/title, not ticker)
    prev_news = {item.get("title", ""): item for item in prev.get("section_2_news", []) if item.get("title")}
    for i, item in enumerate(data.get("section_2_news", [])):
        content = item.get("body", "") or item.get("summary", "")
        if _is_placeholder(content):
            key = item.get("title", "")
            if key and key in prev_news:
                data["section_2_news"][i] = prev_news[key]
                print(f"[MERGE] section_2_news '{key[:30]}': replaced placeholder with previous data")
            else:
                # No title match — take any previous news item that has content
                for prev_item in prev.get("section_2_news", []):
                    prev_content = prev_item.get("body", "") or prev_item.get("summary", "")
                    if not _is_placeholder(prev_content):
                        data["section_2_news"][i] = prev_item
                        print(f"[MERGE] section_2_news fallback: used prev item '{prev_item.get('title','')[:30]}'")
                        break

    # section_7_ai — match by company name
    prev_ai = {item.get("company", ""): item for item in prev.get("section_7_ai", []) if item.get("company")}
    for i, item in enumerate(data.get("section_7_ai", [])):
        update_text = item.get("update", "") or item.get("summary", "")
        if _is_placeholder(update_text):
            key = item.get("company", "")
            if key and key in prev_ai:
                data["section_7_ai"][i] = prev_ai[key]
                print(f"[MERGE] section_7_ai {key}: replaced placeholder with previous data")

    return data


def generate():
    import time

    # Load previous data before generating (for merge fallback)
    prev = _load_previous()

    # Fetch free news context upfront (yfinance + HN + Fear&Greed APIs)
    news_context, fear_greed = build_news_context()

    # Max attempts: 2 per model to reduce wasted API spend
    MAX_ATTEMPTS = 2
    # Only use Pro as last resort (1 attempt — expensive)
    MODEL_ATTEMPTS = [("gemini-2.5-flash", 2), ("gemini-2.5-pro", 1)]

    data = None
    for model, max_att in MODEL_ATTEMPTS:
        for attempt in range(max_att):
            try:
                response = call_gemini(model, attempt, news_context, fear_greed)
                raw = clean_raw(response.text)
                candidate = json.loads(raw)
                candidate = patch_prices(candidate)
                candidate = merge_with_previous(candidate, prev)
                issues = validate(candidate)
                if issues:
                    print(f"[WARN] Validation failed attempt {attempt+1}: {issues[:3]}")
                    if attempt < max_att - 1:
                        time.sleep(10)
                    continue
                data = candidate
                print(f"[OK] JSON parsed and validated — model={model}")
                break
            except json.JSONDecodeError as e:
                print(f"[WARN] Invalid JSON attempt {attempt+1}: {e} — retrying")
                if attempt < max_att - 1:
                    time.sleep(10)
            except Exception as e:
                print(f"[WARN] API error attempt {attempt+1}: {e}")
                if attempt < max_att - 1:
                    time.sleep(15)
        if data is not None:
            break
        print(f"[SKIP] {model} failed after {max_att} attempts")
    if data is None:
        # Fallback: keep last known good data, just refresh generated_at
        if prev:
            print("[FALLBACK] Using last known good latest.json — refreshing timestamp only")
            data = prev
            data["generated_at"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            data["_fallback"] = True
        else:
            print("ERROR: All models exhausted and no fallback available")
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
