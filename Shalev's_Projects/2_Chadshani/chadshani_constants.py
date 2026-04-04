"""
Chadshani constants — prompts, ticker maps, RSS feeds, pricing.
Imported by all other chadshani_*.py modules.
"""
import os
import sys
import json
from datetime import datetime
from google import genai
from google.genai import types

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not set")
    sys.exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

# ── Gemini prompts ─────────────────────────────────────────────────────────────
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
    {"company": "Anthropic",               "product": "חדשות החברה",            "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "Anthropic/Claude",        "product": "Claude 3.7 Sonnet",      "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "Anthropic/Claude Cowork", "product": "Claude for Teams",       "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "Anthropic/Claude Code",   "product": "Claude Code CLI",        "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "OpenAI",                  "product": "חדשות החברה",            "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "OpenAI/ChatGPT",          "product": "ChatGPT",                "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "OpenAI/Codex",            "product": "Codex CLI",              "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "Google",                  "product": "חדשות החברה",            "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "Google/Gemini",           "product": "Gemini 2.5",             "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "Google/AI Studio",        "product": "AI Studio & NotebookLM", "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "xAI/Grok",               "product": "Grok 3",                 "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "Meta/Llama",              "product": "Llama 4",                "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "Perplexity",              "product": "Perplexity AI",          "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"},
    {"company": "Microsoft/Copilot",       "product": "Copilot",                "updates": ["[עדכון 1]","[עדכון 2]","[עדכון 3]","[עדכון 4]","[עדכון 5]"], "last_known_update": "DD/MM/YYYY", "status": "GA"}
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
- **עושר במידע (MUST)**: כל פסקה חייבת להיות מפורטת (לפחות 4-5 משפטים), מקצועית ומעמיקה.
- **section_7_ai**: מכיל 14 ערכים — כל חברה גדולה (Anthropic/OpenAI/Google) מקבלת ערך חדשות חברה (company="X", ללא slash) + ערכים נפרדים לכל מוצר (company="X/מוצר"). חברות קטנות: ערך אחד עם slash. שדה `updates` הוא **מערך** של בדיוק 5 נקודות בעברית לכל ערך.
- **alert.value**: חייב להיות שונה לחלוטין מ-alert.title. השתמש ב-'קריטי' / 'גבוה' / 'בינוני'.
- **איסור כפילויות**: נושא שהופיע ב-"התרעה קריטית" אסור שיופיע שוב בחדשות המיקרו.
- gauges zones — F&G: extreme_fear(0-24)/fear(25-44)/neutral(45-54)/greed(55-74)/extreme_greed(75-100). VIX: low(<15)/medium(15-20)/high(20-30)/extreme(>30).
- section_3_sectors: מיין לפי שינוי אחוזי מהגבוה לנמוך (gainers top).
- החזר JSON בלבד ללא הערות.
"""

# ── Ticker maps & constants ────────────────────────────────────────────────────
MAX_NEWS_AGE_DAYS = 2

CRYPTO_MAP = {
    "BTC": "BTC-USD", "ETH": "ETH-USD", "SOL": "SOL-USD",
    "LINK": "LINK-USD", "XRP": "XRP-USD", "TAO": "TAO1-USD", "KAS": "KAS-USD", "ADA": "ADA-USD"
}

MARKET_SYMBOLS = {
    "^GSPC": "sp500", "^NDX": "nasdaq", "^TNX": "yield_10y", "^DJI": "dji",
    "^VIX": "vix", "GC=F": "gold", "SI=F": "silver", "CL=F": "oil",
    "BTC-USD": "btc", "ETH-USD": "eth", "DX-Y.NYB": "dxy"
}

NEWS_TICKERS = [
    "NVDA", "MSFT", "GOOGL", "META", "AMZN", "AAPL",
    "AMD", "TSM", "AVGO", "MU", "ASML", "QCOM", "ARM", "MRVL", "LRCX", "AMAT",
    "CRM", "NOW", "ORCL", "ADBE", "PLTR", "SNOW",
    "XLK", "XLF", "XLE", "XLY", "XLV", "XLU",
    "BTC-USD", "ETH-USD", "SOL-USD", "LINK-USD", "XRP-USD", "ADA-USD",
]

ETF_SECTORS = ["XLK", "XLV", "XLU", "XLF", "XLE", "XLY", "XLI", "XLB", "XLRE", "XLP", "XLC"]

COINGECKO_MAP = {
    "TAO": "bittensor",
    "KAS": "kaspa",
}

_AI_RSS_FEEDS = [
    ("TechCrunch AI",   "https://techcrunch.com/category/artificial-intelligence/feed/", "item",  "title", "description"),
    ("VentureBeat AI",  "https://venturebeat.com/category/ai/feed/",                     "item",  "title", "description"),
    ("The Verge",       "https://www.theverge.com/rss/index.xml",                        "entry", "title", "summary"),
    ("ArsTechnica",     "https://feeds.arstechnica.com/arstechnica/index",               "item",  "title", "description"),
    ("OpenAI Blog",     "https://openai.com/blog/rss.xml",                               "item",  "title", "description"),
    ("Google DeepMind", "https://deepmind.google/blog/feed/basic",                       "item",  "title", "description"),
    ("Meta AI Eng",     "https://engineering.fb.com/category/ai-research/feed/",         "item",  "title", "description"),
    ("GNews Anthropic", "https://news.google.com/rss/search?q=anthropic+claude&hl=en-US&gl=US&ceid=US:en", "item", "title", "description"),
    ("GNews Gemini",    "https://news.google.com/rss/search?q=google+gemini+AI&hl=en-US&gl=US&ceid=US:en", "item", "title", "description"),
    ("GNews Llama",     "https://news.google.com/rss/search?q=meta+llama+AI&hl=en-US&gl=US&ceid=US:en",    "item", "title", "description"),
    ("GNews Grok",      "https://news.google.com/rss/search?q=xai+grok&hl=en-US&gl=US&ceid=US:en",         "item", "title", "description"),
    ("GNews Perplexity","https://news.google.com/rss/search?q=perplexity+AI&hl=en-US&gl=US&ceid=US:en",    "item", "title", "description"),
    ("GNews Copilot",   "https://news.google.com/rss/search?q=microsoft+copilot+AI&hl=en-US&gl=US&ceid=US:en",       "item", "title", "description"),
    ("GNews Claude Code","https://news.google.com/rss/search?q=anthropic+claude+code+cli&hl=en-US&gl=US&ceid=US:en", "item", "title", "description"),
    ("GNews ChatGPT",   "https://news.google.com/rss/search?q=openai+chatgpt&hl=en-US&gl=US&ceid=US:en",             "item", "title", "description"),
    ("GNews Codex",     "https://news.google.com/rss/search?q=openai+codex+cli&hl=en-US&gl=US&ceid=US:en",           "item", "title", "description"),
    ("GNews AI Studio", "https://news.google.com/rss/search?q=google+ai+studio+notebooklm&hl=en-US&gl=US&ceid=US:en","item", "title", "description"),
]

_MARKET_RSS_FEEDS = [
    ("Reuters Markets",  "https://feeds.reuters.com/reuters/businessNews",                   "item",  "title", "description"),
    ("CNBC Finance",     "https://www.cnbc.com/id/15839069/device/rss/rss.html",             "item",  "title", "description"),
    ("MarketWatch",      "https://feeds.marketwatch.com/marketwatch/topstories/",            "item",  "title", "description"),
    ("Yahoo Finance",    "https://finance.yahoo.com/news/rssindex",                          "item",  "title", "description"),
    ("GNews SP500",      "https://news.google.com/rss/search?q=S%26P+500+market&hl=en-US&gl=US&ceid=US:en",  "item", "title", "description"),
    ("GNews Bitcoin",    "https://news.google.com/rss/search?q=bitcoin+crypto+market&hl=en-US&gl=US&ceid=US:en", "item", "title", "description"),
    ("GNews Fed",        "https://news.google.com/rss/search?q=federal+reserve+interest+rates&hl=en-US&gl=US&ceid=US:en", "item", "title", "description"),
    ("GNews NVDA",       "https://news.google.com/rss/search?q=nvidia+earnings+stock&hl=en-US&gl=US&ceid=US:en", "item", "title", "description"),
]

_AI_KEYWORDS = {
    "openai", "anthropic", "claude", "gemini", "gpt", "llama", "grok", "mistral",
    "deepmind", "copilot", "sora", "chatgpt", "perplexity", "xai", "llm", "ai model",
    "language model", "foundation model", "generative ai", "artificial intelligence",
}

_CONTENT_PLACEHOLDERS = {
    "אין חדשות חדשות מהשבוע האחרון.", "אין חדשות חדשות מהשבוע האחרון",
    "עדכון ידוע: לא זמין", "לא זמין", "לא זמין.", "אין עדכון", "",
}

_NO_NEWS_PHRASES = {
    "אין חדשות חדשות מהשבוע האחרון.", "אין חדשות חדשות מהשבוע האחרון",
    "אין חדשות", "אין עדכון", "לא זמין", "לא חלו שינויים", "ללא ידיעות", "אין מידע",
    "N/A", "לא זמין.", "לא נמצאו ידיעות"
}

# ── Gemini pricing ─────────────────────────────────────────────────────────────
_PRICING = {
    "gemini-2.5-flash-lite": {"in": 0.075, "out": 0.30,  "think": 3.50},
    "gemini-2.5-flash":      {"in": 0.075, "out": 0.30,  "think": 3.50},
    "gemini-2.5-pro":        {"in": 1.25,  "out": 10.00, "think": 3.50},
    "gemini-flash-lite-latest": {"in": 0.075, "out": 0.30, "think": 3.50},
}
USD_TO_ILS = 3.70
COST_LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "cost_log.json")
