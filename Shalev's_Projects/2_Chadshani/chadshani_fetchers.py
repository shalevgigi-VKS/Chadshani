"""
Chadshani fetchers — all free data fetching: news, prices, F&G, crypto.
"""
import re
import time
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
import yfinance as yf

from chadshani_constants import (
    MAX_NEWS_AGE_DAYS, NEWS_TICKERS, _AI_RSS_FEEDS, _MARKET_RSS_FEEDS, _AI_KEYWORDS,
    MARKET_SYMBOLS, ETF_SECTORS, CRYPTO_MAP, COINGECKO_MAP,
)


def fetch_fear_greed():
    """Fetch Fear & Greed indices from free APIs — no API key required."""
    result = {"stock": None, "crypto": None}
    try:
        req = urllib.request.Request(
            "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
                content = item.get("content") or item
                title = (content.get("title") or item.get("title") or "").strip()
                summary = (content.get("summary") or content.get("description")
                           or item.get("summary") or item.get("description") or "").strip()
                if not title or title in seen or count >= max_per:
                    continue
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


def _parse_pub_date(el):
    """Return a timezone-aware datetime from RSS/Atom item element, or None."""
    for tag in ("pubDate", "published", "updated", "date"):
        date_el = el.find(tag)
        if date_el is not None and date_el.text:
            text = date_el.text.strip()
            try:
                dt = parsedate_to_datetime(text)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except Exception:
                pass
            try:
                return datetime.fromisoformat(text.replace("Z", "+00:00"))
            except Exception:
                pass
    return None


def _clean_rss_xml(raw: bytes) -> bytes:
    """Strip namespace prefixes so ElementTree can parse any RSS/Atom feed."""
    raw = re.sub(rb'<(/?)[\w][\w]*:([\w])', rb'<\1\2', raw)
    raw = re.sub(rb'\s[\w][\w]*:[\w][^=>\s]+=(?:"[^"]*"|\'[^\']*\')', b'', raw)
    raw = re.sub(rb'\s+xmlns(?::[^=]+)?="[^"]*"', b'', raw)
    return raw


def fetch_market_rss(max_per_feed=4):
    """Fetch recent finance/market headlines from RSS feeds — no API key required."""
    items = []
    seen = set()
    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_NEWS_AGE_DAYS)
    for label, url, item_tag, title_tag, desc_tag in _MARKET_RSS_FEEDS:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; Chadshani/2.0)"})
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
    print(f"[RSS-MARKET] total: {len(items)} items from {len(_MARKET_RSS_FEEDS)} feeds")
    return items


def fetch_ai_rss(max_per_feed=4):
    """Fetch recent headlines from AI-focused RSS feeds — no API key required."""
    items = []
    seen = set()
    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_NEWS_AGE_DAYS)
    skipped_old = 0
    for label, url, item_tag, title_tag, desc_tag in _AI_RSS_FEEDS:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; Chadshani/2.0)"})
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
    try:
        with urllib.request.urlopen("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=8) as r:
            ids = json.loads(r.read())[:60]
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
                        is_ai = any(kw in title_lower for kw in _AI_KEYWORDS)
                        if is_ai or collected < 5:
                            stories.append(f"• {title}")
                            collected += 1
            except Exception:
                pass
    except Exception as e:
        print(f"[WARN] HN fetch: {e}")
    return stories


def fetch_prices(symbols):
    """Fetch last price and daily change% for a list of yfinance symbols."""
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
    """Fetch crypto price and 24h change using fast_info."""
    try:
        fi = yf.Ticker(yf_sym).fast_info
        price = fi.get("lastPrice") or fi.get("last_price")
        prev = fi.get("previousClose") or fi.get("previous_close")
        if price and prev and prev > 0:
            return float(price), (float(price) - float(prev)) / float(prev) * 100
        hist = yf.Ticker(yf_sym).history(period="5d", interval="1d")
        hist = hist["Close"].dropna()
        if len(hist) >= 2:
            p_now, p_prev = float(hist.iloc[-1]), float(hist.iloc[-2])
            return p_now, (p_now - p_prev) / p_prev * 100
    except Exception as e:
        print(f"[PRICE WARN] crypto {yf_sym}: {e}")
    return None, 0.0


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
    """Fetch global crypto market stats from CoinGecko free API."""
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


def fetch_etf_aum_flows(etf_list):
    """Calculate Notional Flow (Delta-AUM proxy)."""
    result = {}
    for sym in etf_list:
        try:
            t = yf.Ticker(sym)
            fi = t.fast_info
            price = fi.get("lastPrice") or fi.get("last_price")
            prev = fi.get("previousClose") or fi.get("previous_close")
            aum = (t.info or {}).get("totalAssets", 0) or 0
            if price and prev and prev > 0 and aum > 0:
                daily_return = (float(price) - float(prev)) / float(prev)
                flow_m = (aum * daily_return) / 1_000_000
                sign = "+" if flow_m >= 0 else "-"
                if abs(flow_m) >= 1000:
                    result[sym] = f"{sign}${abs(flow_m/1000):.1f}B"
                else:
                    result[sym] = f"{sign}${abs(flow_m):.0f}M"
        except Exception as e:
            print(f"[FLOW WARN] {sym}: {e}")
    return result


def build_news_context():
    """Aggregate free market data into a context string + structured data.
    Returns (context_str, fg_dict, market_prices_dict).
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")
    cutoff_date = (datetime.utcnow() - timedelta(days=MAX_NEWS_AGE_DAYS)).strftime("%Y-%m-%d")
    lines = [
        f"=== נתוני שוק לניתוח — {today} ===",
        f"[RECENCY RULE] Today is {today}. Only use news published on or after {cutoff_date}.",
        f"[RECENCY RULE] For section_7_ai: write only about announcements confirmed in the news context below.",
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

    all_symbols = set(MARKET_SYMBOLS.keys()) | set(ETF_SECTORS)
    for section_tickers in [
        ["NVDA", "TSM", "AMD", "AVGO", "MU", "ASML", "QCOM", "ARM", "MRVL", "LRCX", "AMAT"],
        ["MSFT", "GOOGL", "META", "AMZN", "CRM", "NOW", "ORCL", "ADBE", "PLTR", "SNOW"],
    ]:
        all_symbols.update(section_tickers)
    market_prices = fetch_prices(all_symbols)

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

    market_rss = fetch_market_rss(max_per_feed=4)
    if market_rss:
        lines.append("=== חדשות שוק הון ופיננסים — RSS ===")
        lines.extend(market_rss)
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
    print(f"[CONTEXT] {len(context)} chars | {len(market_rss)} mkt_rss | {len(ai_rss)} ai_rss | {len(stock_news)} stock | {len(hn_news)} HN | F&G={fg}")
    return context, fg, market_prices
