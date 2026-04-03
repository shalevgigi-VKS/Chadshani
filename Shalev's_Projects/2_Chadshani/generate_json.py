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
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
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
סגנון: אנליטי, מקצועי, מעמיק. ספק ערך של אנליסט בכיר.

כללי כתיבה ואמת (v3.2.11):
- עושר במידע: התנסח בצורה מורחבת, עשירה ומעמיקה. ספק ניתוח "בשרני" לכל ידיעה.
- מניעת כפילויות חמורה: **חל איסור מוחלט** על חזרה על אותו נושא או כותרת פעמיים ב-JSON. 
- ייחודיות ההתרעה: הנושא שנבחר ל-section_1_situation.alert **אסור שיופיע** שוב באף אחת מידיעות ה-section_2_news. אלו חייבים להיות נושאים שונים לחלוטין.
- אמינות: אסור להמציא שמות מוצרים, שמות קוד, גרסאות, מודלים, או הכרזות שלא אומתו במקור ידועה.
- במקרה שאין חדשות בתחום מסוים, בצע ניתוח מגמת מחיר (Tech Analysis) או סקירת נרטיב כללית של התחום.
"""

JSON_PROMPT = """
על בסיס חדשות השוק והנתונים שסופקו למעלה, הפק תשובה JSON בלבד (ללא markdown, ללא ```).
מחירים, שינויים אחוזיים, ו-flow_amount יוזרקו אוטומטית — אל תכלול אותם ב-JSON.
הוראה קריטית: אל תהיה תמציתי. ספק ניתוח מורחב ואנליטי לכל שדה.

הפורמט המדויק (שדות טקסט בלבד):
{
  "generated_at": "[ISO timestamp]Z",
  "section_1_situation": {
    "headline": "משפט אחד עוצמתי - תמונת מצב מרכזית של השוק היום (Daily Focus)",
    "analysis": "פסקה עשירה ומפורטת — Risk-on/Risk-off, כוח מניע, סנטימנט והקשר גלובלי",
    "cards": [
      {"label": "מיקוד הוני", "value": "..."},
      {"label": "גורמי חיכוך", "value": "..."},
      {"label": "סביבת מסחר", "value": "..."}
    ],
    "alert": {"title": "התרעת מעקב קריטית", "value": "[רמת חומרה קצרה: 'קריטי' / 'גבוה' / 'בינוני' — חייב להיות שונה לחלוטין מהכותרת, לעולם לא אותו טקסט]", "description": "...", "impact": "HIGH / MEDIUM / LOW VOLATILITY"},
    "gauges": {
      "vix": {"zone": "low/medium/high/extreme", "label": "תיאור מצב VIX"},
      "fear_greed_stock": {"label": "שם המצב בעברית", "zone": "extreme_fear/fear/neutral/greed/extreme_greed"},
      "fear_greed_crypto": {"label": "שם המצב בעברית", "zone": "extreme_fear/fear/neutral/greed/extreme_greed"}
    }
  },
  "section_2_news": [
    {"title": "...", "body": "פסקה מנותחת", "so_what": "משמעות למשקיע"},
    {"title": "...", "body": "...", "so_what": "..."},
    {"title": "...", "body": "...", "so_what": "..."},
    {"title": "...", "body": "...", "so_what": "..."},
    {"title": "...", "body": "...", "so_what": "..."},
    {"title": "...", "body": "...", "so_what": "..."}
  ],
  "section_3_sectors": [
    {"etf": "XLK",  "name": "טכנולוגיה",    "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLV",  "name": "בריאות",        "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLU",  "name": "תשתיות",        "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLF",  "name": "פיננסים",       "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLE",  "name": "אנרגיה",        "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLY",  "name": "צריכה מחזורית", "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLI",  "name": "תעשייה",        "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLB",  "name": "חומרי גלם",     "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLRE", "name": "נדל\"ן",         "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLP",  "name": "צריכה בסיסית",  "flow_direction": "in/out/neutral", "note": "..."},
    {"etf": "XLC",  "name": "תקשורת",        "flow_direction": "in/out/neutral", "note": "..."}
  ],
  "section_4_crypto": [
    {"ticker": "BTC",  "note": "..."},
    {"ticker": "ETH",  "note": "..."},
    {"ticker": "SOL",  "note": "..."},
    {"ticker": "LINK", "note": "..."},
    {"ticker": "XRP",  "note": "..."},
    {"ticker": "ADA",  "note": "..."},
    {"ticker": "TAO",  "note": "..."},
    {"ticker": "KAS",  "note": "..."}
  ],
  "section_4_crypto_brief": {
    "daily_narrative": "סיפור היום בקריפטו — לפחות 3-4 משפטים",
    "smart_money": "ניתוח מודל — זרימת כסף מוסדי, ETF flows (לפחות 2-3 משפטים)",
    "whale_activity": "ניתוח מודל — פעילות לוויתנים, on-chain signals (לפחות 2-3 משפטים)",
    "conclusion": "מסקנה ותזה למשקיע — חייב להיות הסבר מפורט ומעמיק"
  },
  "section_5_semis": [
    {"ticker": "NVDA", "note": "..."},
    {"ticker": "TSM",  "note": "..."},
    {"ticker": "AMD",  "note": "..."},
    {"ticker": "AVGO", "note": "..."},
    {"ticker": "MU",   "note": "..."},
    {"ticker": "ASML", "note": "..."},
    {"ticker": "QCOM", "note": "..."},
    {"ticker": "ARM",  "note": "..."},
    {"ticker": "MRVL", "note": "..."},
    {"ticker": "LRCX", "note": "..."},
    {"ticker": "AMAT", "note": "..."}
  ],
  "section_6_software": [
    {"ticker": "MSFT",  "note": "..."},
    {"ticker": "GOOGL", "note": "..."},
    {"ticker": "META",  "note": "..."},
    {"ticker": "AMZN",  "note": "..."},
    {"ticker": "CRM",   "note": "..."},
    {"ticker": "NOW",   "note": "..."},
    {"ticker": "ORCL",  "note": "..."},
    {"ticker": "ADBE",  "note": "..."},
    {"ticker": "PLTR",  "note": "..."},
    {"ticker": "SNOW",  "note": "..."}
  ],
  "section_7_ai": [
    {"company": "OpenAI",          "product": "[שם מוצר עיקרי]", "updates": ["[עדכון 1 — שחרור מודל / גרסה חדשה]", "[עדכון 2 — יכולת חדשה / Feature]", "[עדכון 3 — שינוי תמחור / API]", "[עדכון 4 — שיתוף פעולה / עסקה]", "[עדכון 5 — ביצועים / Benchmark]", "[עדכון 6 — הגעה לשוק חדש / מוצר צדדי]", "[עדכון 7 — מדיניות / בטיחות / רגולציה]", "[עדכון 8 — תגובת שוק / מחיר מניה / השפעה פיננסית]", "[עדכון 9 — מחקר / פרסום אקדמי / פטנט]", "[עדכון 10 — תחרות / השוואה לשחקנים אחרים בשוק]"], "last_known_update": "DD/MM/YYYY", "status": "GA/Beta"},
    {"company": "Google/Gemini",   "product": "...", "updates": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."], "last_known_update": "DD/MM/YYYY", "status": "GA/Beta"},
    {"company": "Anthropic/Claude","product": "...", "updates": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."], "last_known_update": "DD/MM/YYYY", "status": "GA/Beta"},
    {"company": "Meta/Llama",      "product": "...", "updates": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."], "last_known_update": "DD/MM/YYYY", "status": "GA/Beta"},
    {"company": "xAI/Grok",        "product": "...", "updates": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."], "last_known_update": "DD/MM/YYYY", "status": "GA/Beta"},
    {"company": "Perplexity",      "product": "...", "updates": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."], "last_known_update": "DD/MM/YYYY", "status": "GA/Beta"}
  ],
  "section_8_conclusion": {
    "thesis": "תזת ההשקעה הדומיננטית — פסקה מנותחת",
    "risks": "סיכונים עיקריים — פסקה מנותחת",
    "opportunities": "הזדמנויות ספציפיות לשבוע הקרוב",
    "action": "משפט מסכם — מה הפעולה הנכונה עכשיו"
  },
  "section_8_watchlist": {
    "rising":  [
      {"ticker": "NVDA", "note": "למה לעקוב", "signal": "BUY",  "reason": "סיבה טכנית/פונדמנטלית"},
      {"ticker": "...",  "note": "...",         "signal": "BUY",  "reason": "..."},
      {"ticker": "...",  "note": "...",         "signal": "BUY",  "reason": "..."},
      {"ticker": "...",  "note": "...",         "signal": "BUY",  "reason": "..."},
      {"ticker": "...",  "note": "...",         "signal": "BUY",  "reason": "..."},
      {"ticker": "...",  "note": "...",         "signal": "BUY",  "reason": "..."}
    ],
    "falling": [
      {"ticker": "META", "note": "למה לעקוב", "signal": "SELL", "reason": "סיבה טכנית/פונדמנטלית"},
      {"ticker": "...",  "note": "...",         "signal": "SELL", "reason": "..."},
      {"ticker": "...",  "note": "...",         "signal": "SELL", "reason": "..."},
      {"ticker": "...",  "note": "...",         "signal": "SELL", "reason": "..."},
      {"ticker": "...",  "note": "...",         "signal": "SELL", "reason": "..."},
      {"ticker": "...",  "note": "...",         "signal": "SELL", "reason": "..."}
    ]
  }
}

כללים קריטיים — מדיניות "אפס תוכן דל" (v3.2.13):
- **חל איסור מוחלט** על שימוש בביטוי "אין חדשות חדשות", "מידע לא זמין", "לא חלו שינויים" או "Placeholder".
- **עושר במידע (MUST)**: כל פסקה (Analysis, Narrative, Conclusion) חייבת להיות מפורטת (לפחות 4-5 משפטים), מקצועית ומעמיקה. אם אין חדשות דחופות, בצע ניתוח טכני (Chart Context) או רעיוני (Investment Thesis) רלוונטי.
- **section_7_ai**: שדה `updates` הוא **מערך** של בדיוק 10 נקודות בעברית לכל חברה. כל נקודה מכסה זווית שונה: (1) שחרור מודל/גרסה, (2) יכולת חדשה, (3) תמחור/API, (4) שיתוף פעולה/עסקה, (5) ביצועים/benchmark, (6) שוק חדש/מוצר צדדי, (7) מדיניות/בטיחות, (8) תגובת שוק/מניה, (9) מחקר/פרסום, (10) תחרות/השוואה. אם אין חדשות בנושא מסוים — כתוב ניתוח רקע רלוונטי. אסור לכתוב "אין חדשות".
- **alert.value**: חייב להיות שונה לחלוטין מ-alert.title. השתמש ב-'קריטי' / 'גבוה' / 'בינוני' — לא שם אירוע.
- **איסור כפילויות**: נושא שהופיע ב-"התרעה קריטית" (Alert) או בפרספקטיבה היומית — **אסור** שיופיע שוב בחדשות המיקרו או ב-AI.
- **עולם הקריפטו**: הרחב את הניתוח על זרימת כסף ל-ETFs, פעילות לוויתנים ב-On-chain, וקשר למקרו (סביבת ריבית). הפוך את הניתוח ל-"חי" ורלוונטי לרגע זה.
- **לוגואים**: אם חברה לא מופיעה במידע — השתמש בלוגו של החברה האם או הסקטור.
- gauges zones — F&G: extreme_fear(0-24)/fear(25-44)/neutral(45-54)/greed(55-74)/extreme_greed(75-100). VIX: low(<15)/medium(15-20)/high(20-30)/extreme(>30).
- section_3_sectors: מיין לפי שינוי אחוזי מהגבוה לנמוך (gainers top).
- החזר JSON בלבד ללא הערות.
"""

# Models: flash (2 attempts) → pro (1 attempt, expensive last resort)
# Defined inline in generate() as MODEL_ATTEMPTS

MAX_NEWS_AGE_DAYS = 7   # skip news items older than this

# Crypto ticker mapping: JSON ticker → yfinance symbol
CRYPTO_MAP = {
    "BTC": "BTC-USD", "ETH": "ETH-USD", "SOL": "SOL-USD", 
    "LINK": "LINK-USD", "XRP": "XRP-USD", "TAO": "TAO1-USD", "KAS": "KAS-USD", "ADA": "ADA-USD"
}

# Market indices: yfinance symbol → JSON key
MARKET_SYMBOLS = {
    "^GSPC": "sp500", "^NDX": "nasdaq", "^TNX": "yield_10y", "^DJI": "dji", 
    "^VIX": "vix", "GC=F": "gold", "SI=F": "silver", "CL=F": "oil", 
    "BTC-USD": "btc", "ETH-USD": "eth", "DX-Y.NYB": "dxy"
}

# Tickers to fetch news for (covers all major tracked companies + sector ETFs)
NEWS_TICKERS = [
    "NVDA", "MSFT", "GOOGL", "META", "AMZN", "AAPL",
    "AMD", "TSM", "AVGO", "MU", "ASML", "QCOM", "ARM", "MRVL", "LRCX", "AMAT",
    "CRM", "NOW", "ORCL", "ADBE", "PLTR", "SNOW",
    "XLK", "XLF", "XLE", "XLY", "XLV", "XLU",
    "BTC-USD", "ETH-USD", "SOL-USD", "LINK-USD", "XRP-USD", "ADA-USD",
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
    cutoff_epoch = time.time() - MAX_NEWS_AGE_DAYS * 86400
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
                if not title or title in seen or count >= max_per:
                    continue
                # Filter by publish time when available
                pub_ts = (item.get("providerPublishTime") or
                          (content.get("providerPublishTime") if isinstance(content, dict) else None) or 0)
                if pub_ts and pub_ts < cutoff_epoch:
                    continue
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
    # General AI tech news
    ("TechCrunch AI",  "https://techcrunch.com/category/artificial-intelligence/feed/", "item",  "title", "description"),
    ("VentureBeat AI", "https://venturebeat.com/category/ai/feed/",                     "item",  "title", "description"),
    ("The Verge",      "https://www.theverge.com/rss/index.xml",                        "entry", "title", "summary"),
    ("ArsTechnica",    "https://feeds.arstechnica.com/arstechnica/index",               "item",  "title", "description"),
    # Official company feeds
    ("OpenAI Blog",    "https://openai.com/blog/rss.xml",                               "item",  "title", "description"),
    ("Google DeepMind","https://deepmind.google/blog/feed/basic",                       "item",  "title", "description"),
    ("Meta AI Eng",    "https://engineering.fb.com/category/ai-research/feed/",         "item",  "title", "description"),
    # Google News per-company — ensures model news is always present
    ("GNews Anthropic", "https://news.google.com/rss/search?q=anthropic+claude&hl=en-US&gl=US&ceid=US:en", "item", "title", "description"),
    ("GNews Gemini",    "https://news.google.com/rss/search?q=google+gemini+AI&hl=en-US&gl=US&ceid=US:en", "item", "title", "description"),
    ("GNews Llama",     "https://news.google.com/rss/search?q=meta+llama+AI&hl=en-US&gl=US&ceid=US:en",    "item", "title", "description"),
    ("GNews Grok",      "https://news.google.com/rss/search?q=xai+grok&hl=en-US&gl=US&ceid=US:en",         "item", "title", "description"),
    ("GNews Perplexity","https://news.google.com/rss/search?q=perplexity+AI&hl=en-US&gl=US&ceid=US:en",    "item", "title", "description"),
]

_AI_KEYWORDS = {
    "openai", "anthropic", "claude", "gemini", "gpt", "llama", "grok", "mistral",
    "deepmind", "copilot", "sora", "chatgpt", "perplexity", "xai", "llm", "ai model",
    "language model", "foundation model", "generative ai", "artificial intelligence",
}


def _parse_pub_date(el) -> datetime | None:
    """Return a timezone-aware datetime from RSS/Atom item element, or None."""
    for tag in ("pubDate", "published", "updated", "date"):
        date_el = el.find(tag)
        if date_el is not None and date_el.text:
            text = date_el.text.strip()
            # RFC 2822 (RSS pubDate)
            try:
                dt = parsedate_to_datetime(text)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except Exception:
                pass
            # ISO 8601 (Atom published/updated)
            try:
                return datetime.fromisoformat(text.replace("Z", "+00:00"))
            except Exception:
                pass
    return None


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
    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_NEWS_AGE_DAYS)
    skipped_old = 0
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
                if not title or title in seen or count >= max_per_feed:
                    continue
                pub_dt = _parse_pub_date(el)
                if pub_dt and pub_dt < cutoff:
                    skipped_old += 1
                    continue
                seen.add(title)
                line = f"[{label}] {title}"
                if desc:
                    line += f": {desc}"
                items.append(line)
                count += 1
            print(f"[RSS] {label}: {count} items")
        except Exception as e:
            print(f"[WARN] RSS {label}: {e}")
    print(f"[RSS] total: {len(items)} AI items from {len(_AI_RSS_FEEDS)} feeds (skipped {skipped_old} old)")
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
    """Aggregate free market data into a context string + structured local data dict.
    Returns (context_str, fg_dict, market_prices_dict) — prices fetched once, reused by patch_prices.
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")
    cutoff_date = (datetime.utcnow() - timedelta(days=MAX_NEWS_AGE_DAYS)).strftime("%Y-%m-%d")
    lines = [
        f"=== נתוני שוק לניתוח — {today} ===",
        f"[RECENCY RULE] Today is {today}. Only use news published on or after {cutoff_date}.",
        f"[RECENCY RULE] For section_7_ai: write only about announcements confirmed in the news context below. If no news exists for a company, write 'אין חדשות חדשות מהשבוע האחרון.' — do NOT use training knowledge for specific model names or dates.",
        "",
    ]

    fg = fetch_fear_greed()
    if fg["stock"] is not None or fg["crypto"] is not None:
        lines.append("=== Fear & Greed Indices ===")
        if fg["stock"] is not None:
            lines.append(f"Stock Market Fear & Greed Index: {fg['stock']}/100")
        if fg["crypto"] is not None:
            lines.append(f"Crypto Fear & Greed Index: {fg['crypto']}/100")
        lines.append("")

    # Fetch all market prices upfront — used both as Gemini context and for JSON injection
    all_symbols = set(MARKET_SYMBOLS.keys()) | set(ETF_SECTORS)
    for section_tickers in [
        ["NVDA","TSM","AMD","AVGO","MU","ASML","QCOM","ARM","MRVL","LRCX","AMAT"],
        ["MSFT","GOOGL","META","AMZN","CRM","NOW","ORCL","ADBE","PLTR","SNOW"],
    ]:
        all_symbols.update(section_tickers)
    market_prices = fetch_prices(all_symbols)

    # Add real market prices as plain-text context for Gemini analysis
    idx_labels = {"^GSPC": "S&P 500", "^NDX": "Nasdaq 100", "^DJI": "Dow Jones",
                  "^VIX": "VIX", "^TNX": "10Y Yield", "GC=F": "Gold",
                  "SI=F": "Silver", "CL=F": "Oil (WTI)", "DX-Y.NYB": "DXY",
                  "BTC-USD": "Bitcoin", "ETH-USD": "Ethereum"}
    lines.append("=== מדדים ונכסים (yfinance — מחיר סגירה אחרון) ===")
    for sym, label in idx_labels.items():
        if sym in market_prices:
            p, c = market_prices[sym]
            sign = "+" if c >= 0 else ""
            lines.append(f"{label}: {p:,.2f}  ({sign}{c:.2f}%)")
    lines.append("")

    ai_rss = fetch_ai_rss(max_per_feed=5)
    if ai_rss:
        lines.append("=== חדשות AI — RSS ===")
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
    return context, fg, market_prices


ETF_SECTORS = ["XLK", "XLV", "XLU", "XLF", "XLE", "XLY", "XLI", "XLB", "XLRE", "XLP", "XLC"]


def fetch_etf_aum_flows(etf_list):
    """v3.2.16: Calculate Notional Flow (Delta-AUM proxy).
    """
    result = {}
    for sym in etf_list:
        try:
            t = yf.Ticker(sym)
            fi = t.fast_info
            price = fi.get("lastPrice") or fi.get("last_price")
            prev  = fi.get("previousClose") or fi.get("previous_close")
            aum   = (t.info or {}).get("totalAssets", 0) or 0
            if price and prev and prev > 0 and aum > 0:
                daily_return = (float(price) - float(prev)) / float(prev)
                flow_m = (aum * daily_return) / 1_000_000
                sign = "+" if flow_m >= 0 else "-"
                # Amplify the display for heat: millions instead of billions for smaller caps
                if abs(flow_m) >= 1000:
                    result[sym] = f"{sign}${abs(flow_m/1000):.1f}B"
                else:
                    result[sym] = f"{sign}${abs(flow_m):.0f}M"
        except Exception as e:
            print(f"[FLOW WARN] {sym}: {e}")
    return result


def fetch_prices(symbols):
    """Fetch last price and daily change% for a list of yfinance symbols.
    Returns dict: symbol → (price_float, change_pct_float)
    """
    result = {}
    if not symbols:
        return result
    for sym in symbols:
        try:
            fi = yf.Ticker(sym).fast_info
            price = fi.get("lastPrice") or fi.get("last_price")
            prev = fi.get("previousClose") or fi.get("previous_close")
            if price and prev and prev > 0:
                result[sym] = (float(price), (float(price) - float(prev)) / float(prev) * 100)
            else:
                hist = yf.Ticker(sym).history(period="5d", interval="1d")
                if "Close" in hist:
                    prices = hist["Close"].dropna()
                    if len(prices) >= 2:
                        p_now, p_prev = float(prices.iloc[-1]), float(prices.iloc[-2])
                        result[sym] = (p_now, (p_now - p_prev) / p_prev * 100)
                    elif len(prices) == 1:
                        result[sym] = (float(prices.iloc[-1]), 0.0)
        except Exception as e:
            print(f"[PRICE WARN] fetch failed for {sym}: {e}")
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




# CoinGecko ID mapping for tokens not available on yfinance
COINGECKO_MAP = {
    "TAO": "bittensor",
    "KAS": "kaspa",
}

def fetch_coingecko_price(coin_id):
    """Fetch price + 24h change from CoinGecko free API (no key required)."""
    try:
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd&include_24hr_change=true"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode())
        if coin_id in data:
            price = data[coin_id].get("usd")
            change = data[coin_id].get("usd_24h_change", 0.0)
            if price:
                return float(price), float(change)
    except Exception as e:
        print(f"[COINGECKO WARN] {coin_id}: {e}")
    return None, 0.0


def fetch_coingecko_global():
    """Fetch global crypto market stats from CoinGecko free API (no key required)."""
    try:
        req = urllib.request.Request(
            "https://api.coingecko.com/api/v3/global",
            headers={"User-Agent": "Mozilla/5.0 (compatible; Chadshani/3.0)"}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read())["data"]
        result = {
            "market_cap_usd": d["total_market_cap"]["usd"],
            "btc_dominance": round(d["market_cap_percentage"]["btc"], 1),
            "eth_dominance": round(d["market_cap_percentage"]["eth"], 1),
            "volume_24h": d["total_volume"]["usd"],
            "change_24h": round(d["market_cap_change_percentage_24h_usd"], 2),
        }
        print(f"[COINGECKO] Global: market_cap=${result['market_cap_usd']/1e12:.2f}T BTC.D={result['btc_dominance']}%")
        return result
    except Exception as e:
        print(f"[WARN] CoinGecko global: {e}")
        return None

def patch_prices(data, market_prices=None, fear_greed=None):
    """Inject all numerical data from local sources into the Gemini text skeleton.
    market_prices: pre-fetched dict from build_news_context (avoids double fetch).
    fear_greed: F&G dict for gauge value injection.
    """
    # Use pre-fetched prices if available, otherwise fetch now
    if market_prices is None:
        all_syms = set(MARKET_SYMBOLS.keys())
        for s in ("section_3_sectors", "section_5_semis", "section_6_software"):
            for item in data.get(s, []):
                sym = item.get("etf") or item.get("ticker")
                if sym:
                    all_syms.add(sym)
        market_prices = fetch_prices(all_syms)

    # ── section_3_sectors: change% + flow_amount + flow_direction (all local) ──
    etf_flows = fetch_etf_aum_flows(ETF_SECTORS)
    for item in data.get("section_3_sectors", []):
        sym = item.get("etf")
        if sym and sym in market_prices:
            _, c = market_prices[sym]
            item["change"] = fmt_change(c)
            # flow_direction derived from actual price change — overrides Gemini
            if c > 0.15:
                item["flow_direction"] = "in"
            elif c < -0.15:
                item["flow_direction"] = "out"
            else:
                item["flow_direction"] = "neutral"
        if sym and sym in etf_flows:
            item["flow_amount"] = etf_flows[sym]

    # ── section_5_semis + section_6_software: price + change ──────────────────
    for section in ("section_5_semis", "section_6_software"):
        for item in data.get(section, []):
            sym = item.get("ticker")
            if sym and sym in market_prices:
                p, c = market_prices[sym]
                item["price"] = fmt_price(p)
                item["change"] = fmt_change(c)

    # ── section_4_crypto: price + change_24h ──────────────────────────────────
    for item in data.get("section_4_crypto", []):
        ticker = item.get("ticker", "")
        p, c = None, 0.0
        # Try yfinance first, fall back to CoinGecko for tokens not on Yahoo
        yf_sym = CRYPTO_MAP.get(ticker)
        if yf_sym:
            p, c = fetch_crypto_price(yf_sym)
        if p is None and ticker in COINGECKO_MAP:
            p, c = fetch_coingecko_price(COINGECKO_MAP[ticker])
        if p is not None:
            item["price"] = fmt_price(p, is_crypto=True)
            item["change_24h"] = fmt_change(c)

    # ── markets block (indices) ────────────────────────────────────────────────
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

    # ── gauges: inject real values (VIX from yfinance, F&G from APIs) ─────────
    gauges = data.get("section_1_situation", {}).get("gauges", {})
    if "vix" in markets and gauges.get("vix") is not None:
        gauges["vix"]["value"] = markets["vix"]["value"]
    if fear_greed:
        if fear_greed.get("stock") is not None and gauges.get("fear_greed_stock") is not None:
            gauges["fear_greed_stock"]["value"] = str(fear_greed["stock"])
        if fear_greed.get("crypto") is not None and gauges.get("fear_greed_crypto") is not None:
            gauges["fear_greed_crypto"]["value"] = str(fear_greed["crypto"])

    # ── crypto_global: total market cap, BTC dominance (CoinGecko free) ──────────
    cg = fetch_coingecko_global()
    if cg:
        data["crypto_global"] = cg

    print(f"[INJECT] {len(etf_flows)} ETF flows | {len(markets)} market indices | gauges patched")
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
                                ("section_5_semis", 11), ("section_6_software", 10),
                                ("section_7_ai", 4)]:
        items = data.get(section, [])
        count = len(items)
        if count < min_items:
            issues.append(f"{section} has {count} items (need {min_items})")
        
        # Check for empty nested objects inside list
        if count > 0:
            for i, itm in enumerate(items):
                if not itm or not isinstance(itm, dict):
                    issues.append(f"{section}[{i}] is empty or invalid")
                else:
                    for k, v in itm.items():
                        if not v or str(v).strip() == "":
                            issues.append(f"{section}[{i}].{k} is completely empty")

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
    
    # Check section_8_conclusion values are not empty
    concl = data.get("section_8_conclusion", {})
    for key in ["thesis", "risks", "opportunities", "action"]:
        if not concl.get(key) or str(concl.get(key)).strip() == "":
            issues.append(f"section_8_conclusion.{key} is empty")

    # Markets block must exist
    if not data.get("markets"):
        issues.append("markets block missing")

    # PERFECTIONIST AUDIT (v3.2.12): Block placeholder phrases
    blacklist = ["אין חדשות", "אין עדכון", "לא זמין", "לא חלו שינויים", "ללא ידיעות", "אין מידע", "N/A"]
    raw_str = json.dumps(data, ensure_ascii=False)
    for phrase in blacklist:
        if phrase in raw_str:
            issues.append(f"Content contains blocked placeholder: {phrase}")

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
    # Gemini 2.5 Flash: input $0.075/M, output $0.30/M, THINKING $3.50/M
    # Thinking tokens are billed separately and NOT included in candidates_token_count
    "gemini-2.5-flash": {"in": 0.075, "out": 0.30, "think": 3.50},
    # Gemini 2.5 Pro: input $1.25/M, output $10.00/M, thinking $3.50/M
    "gemini-2.5-pro":   {"in": 1.25,  "out": 10.00, "think": 3.50},
}
USD_TO_ILS = 3.70   # updated: ~3.70 ILS/USD (April 2026)
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
    """Calculate cost including thinking tokens (Gemini 2.5 billing model)."""
    try:
        p = _PRICING.get(model, _PRICING["gemini-2.5-flash"])
        in_tok    = getattr(usage, "prompt_token_count", 0) or 0
        out_tok   = getattr(usage, "candidates_token_count", 0) or 0
        # Thinking tokens: field name varies across SDK versions
        think_tok = (getattr(usage, "thoughts_token_count", 0) or
                     getattr(usage, "thinking_token_count", 0) or 0)
        cost_usd = (in_tok    / 1_000_000 * p["in"] +
                    out_tok   / 1_000_000 * p["out"] +
                    think_tok / 1_000_000 * p.get("think", 0))
        cost_ils = cost_usd * USD_TO_ILS
        log = _load_cost_log()
        log["runs"].append({
            "ts": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "model": model,
            "in_tokens": in_tok,
            "out_tokens": out_tok,
            "think_tokens": think_tok,
            "cost_usd": round(cost_usd, 5),
            "cost_ils": round(cost_ils, 4),
        })
        log["total_usd"] = round(log["total_usd"] + cost_usd, 5)
        log["total_ils"] = round(log["total_ils"] + cost_ils, 4)
        _save_cost_log(log)
        think_note = f" think={think_tok}" if think_tok else ""
        print(f"[COST] in={in_tok} out={out_tok}{think_note} | "
              f"run=${cost_usd:.5f}/₪{cost_ils:.4f} | "
              f"month: see chadshani_auto budget check")
    except Exception as e:
        print(f"[COST] tracking error: {e}")


def call_gemini(model, attempt, news_context):
    print(f"[TRY] model={model} attempt={attempt+1}")
    today = datetime.utcnow().strftime("%Y-%m-%d")

    full_prompt = (
        f"היום: {today}.\n"
        f"החדשות והנתונים הבאים נאספו עכשיו ממקורות חינמיים:\n\n"
        f"{news_context}\n\n"
        "הוראה קריטית: השתמש אך ורק בנתונים שסופקו למעלה. "
        "אסור להמציא חדשות שאינן בחומר. "
        "אם אין מידע על חברה ב-section_7_ai — כתוב 'אין חדשות חדשות מהשבוע האחרון.' בלבד.\n\n"
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


# Blacklist for automated rejection of thin content
_NO_NEWS_PHRASES = {
    "אין חדשות חדשות מהשבוע האחרון.", "אין חדשות חדשות מהשבוע האחרון",
    "אין חדשות", "אין עדכון", "לא זמין", "לא חלו שינויים", "ללא ידיעות", "אין מידע",
    "N/A", "לא זמין.", "לא נמצאו ידיעות"
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


def deduplicate_sections(data):
    """v3.2.16: Aggressive de-duplication.
    Strip entries that share more than 2 significant keywords with higher priority sections.
    """
    seen_concepts = set()
    
    def extract_keywords(text):
        if not text: return set()
        # Filter for significant words (length > 4)
        words = re.findall(r'\w{5,}', text.lower())
        return set(words)

    # 1. Alert & Hero (Highest Priority)
    hero_text = (data.get("section_1_situation", {}).get("headline", "") + " " + 
                 data.get("section_1_situation", {}).get("analysis", ""))
    seen_concepts.update(extract_keywords(hero_text))
    
    alert_text = data.get("section_1_situation", {}).get("alert_title", "")
    seen_concepts.update(extract_keywords(alert_text))

    # 2. AI Intelligence (Section 7)
    ai_items = data.get("section_7_ai", [])
    for item in ai_items:
        upd = item.get("update", "")
        if upd: 
            # If current AI update overlaps with Hero/Alert, we keep it (AI is high priority)
            # but we will use it to strip General News.
            seen_concepts.update(extract_keywords(upd))

    # 3. Filter General News (Section 2)
    news = data.get("section_2_news", [])
    filtered_news = []
    for item in news:
        head = item.get("headline", "")
        body = item.get("body", "")
        news_concepts = extract_keywords(head + " " + body)
        
        # Check overlap
        overlap = news_concepts.intersection(seen_concepts)
        if len(overlap) >= 2:
            print(f"[DEDUPE] Dropping duplicate news: {head[:40]}... (Overlap: {list(overlap)[:3]})")
            continue
        filtered_news.append(item)
    data["section_2_news"] = filtered_news
    
    # 4. Filter Crypto Narrative from Global News
    crypto_text = data.get("section_5_crypto", {}).get("narrative", "")
    seen_concepts.update(extract_keywords(crypto_text))
    
    return data


def merge_prev_no_news(data, prev):
    """For section_7_ai: if Gemini returned 'no news' for a company,
    replace with the previous run's data for that company.
    Rule: never show empty — always show last known real content.
    """
    if not prev:
        return data
    prev_ai = {item["company"]: item for item in prev.get("section_7_ai", [])}
    for item in data.get("section_7_ai", []):
        update = (item.get("update") or "").strip()
        if update in _NO_NEWS_PHRASES and item["company"] in prev_ai:
            prev_item = prev_ai[item["company"]]
            prev_update = (prev_item.get("update") or "").strip()
            if prev_update and prev_update not in _NO_NEWS_PHRASES:
                item["update"] = prev_item["update"]
                item["product"] = prev_item.get("product", item.get("product", ""))
                item["last_known_update"] = prev_item.get("last_known_update", item.get("last_known_update", ""))
                item["status"] = prev_item.get("status", item.get("status", "GA"))
                print(f"[MERGE] section_7_ai {item['company']}: used previous data ({item['last_known_update']})")
    return data





def generate():
    import time

    # Load previous data before generating (for merge fallback)
    prev = _load_previous()

    # Fetch free news context + all market prices upfront (single fetch, reused below)
    news_context, fear_greed, market_prices = build_news_context()

    # Models: gemini-flash-lite-latest (free tier alias — v3.3.4)
    MODEL_ATTEMPTS = [("models/gemini-flash-lite-latest", 3)]

    data = None
    for model, max_att in MODEL_ATTEMPTS:
        for attempt in range(max_att):
            try:
                response = call_gemini(model, attempt, news_context)
                raw = clean_raw(response.text)
                candidate = json.loads(raw)
                candidate = patch_prices(candidate, market_prices=market_prices, fear_greed=fear_greed)
                candidate = merge_prev_no_news(candidate, prev)
                candidate = deduplicate_sections(candidate) # v3.2.14
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
