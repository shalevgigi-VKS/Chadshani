"""
Chadshani processing — patch_prices, validate, clean_raw, dedup, merge.
"""
import re
import json

from chadshani_constants import (
    MARKET_SYMBOLS, ETF_SECTORS, CRYPTO_MAP, COINGECKO_MAP, _NO_NEWS_PHRASES,
)
from chadshani_fetchers import (
    fetch_prices, fetch_etf_aum_flows, fetch_crypto_price,
    fetch_coingecko_price, fetch_coingecko_global, fmt_price, fmt_change,
)


def patch_prices(data, market_prices=None, fear_greed=None):
    """Inject all numerical data from local sources into the Gemini text skeleton."""
    if market_prices is None:
        all_syms = set(MARKET_SYMBOLS.keys())
        for s in ("section_3_sectors", "section_5_semis", "section_6_software"):
            for item in data.get(s, []):
                sym = item.get("etf") or item.get("ticker")
                if sym:
                    all_syms.add(sym)
        market_prices = fetch_prices(all_syms)

    etf_flows = fetch_etf_aum_flows(ETF_SECTORS)
    for item in data.get("section_3_sectors", []):
        sym = item.get("etf")
        if sym and sym in market_prices:
            _, c = market_prices[sym]
            item["change"] = fmt_change(c)
            if c > 0.15:
                item["flow_direction"] = "in"
            elif c < -0.15:
                item["flow_direction"] = "out"
            else:
                item["flow_direction"] = "neutral"
        if sym and sym in etf_flows:
            item["flow_amount"] = etf_flows[sym]

    for section in ("section_5_semis", "section_6_software"):
        for item in data.get(section, []):
            sym = item.get("ticker")
            if sym and sym in market_prices:
                p, c = market_prices[sym]
                item["price"] = fmt_price(p)
                item["change"] = fmt_change(c)

    for item in data.get("section_4_crypto", []):
        ticker = item.get("ticker", "")
        p, c = None, 0.0
        yf_sym = CRYPTO_MAP.get(ticker)
        if yf_sym:
            p, c = fetch_crypto_price(yf_sym)
        if p is None and ticker in COINGECKO_MAP:
            p, c = fetch_coingecko_price(COINGECKO_MAP[ticker])
        if p is not None:
            item["price"] = fmt_price(p, is_crypto=True)
            item["change_24h"] = fmt_change(c)

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

    gauges = data.get("section_1_situation", {}).get("gauges", {})
    if "vix" in markets and gauges.get("vix") is not None:
        gauges["vix"]["value"] = markets["vix"]["value"]
    if fear_greed:
        if fear_greed.get("stock") is not None and gauges.get("fear_greed_stock") is not None:
            gauges["fear_greed_stock"]["value"] = str(fear_greed["stock"])
        if fear_greed.get("crypto") is not None and gauges.get("fear_greed_crypto") is not None:
            gauges["fear_greed_crypto"]["value"] = str(fear_greed["crypto"])

    cg = fetch_coingecko_global()
    if cg:
        data["crypto_global"] = cg

    print(f"[INJECT] {len(etf_flows)} ETF flows | {len(markets)} market indices | gauges patched")
    return data


def validate(data):
    """Returns list of critical missing fields. Empty list = pass."""
    issues = []
    for item in data.get("section_5_semis", []):
        if item.get("price") in ("לא זמין", "$...", None):
            issues.append(f"semis {item.get('ticker')} price missing")
    for item in data.get("section_6_software", []):
        if item.get("price") in ("לא זמין", "$...", None):
            issues.append(f"software {item.get('ticker')} price missing")
    for item in data.get("section_4_crypto", []):
        if item.get("price") in ("לא זמין", "$...", None):
            issues.append(f"crypto {item.get('ticker')} price missing")

    for section, min_items in [("section_2_news", 6), ("section_3_sectors", 11),
                                ("section_5_semis", 11), ("section_6_software", 10),
                                ("section_7_ai", 4)]:
        items = data.get(section, [])
        count = len(items)
        if count < min_items:
            issues.append(f"{section} has {count} items (need {min_items})")
        if count > 0:
            for i, itm in enumerate(items):
                if not itm or not isinstance(itm, dict):
                    issues.append(f"{section}[{i}] is empty or invalid")
                else:
                    for k, v in itm.items():
                        if not v or str(v).strip() == "":
                            issues.append(f"{section}[{i}].{k} is completely empty")

    wl = data.get("section_8_watchlist", {})
    if isinstance(wl, dict):
        for side in ("rising", "falling"):
            count = len(wl.get(side, []))
            if count < 6:
                issues.append(f"section_8_watchlist.{side} has {count} items (need 6)")
    else:
        issues.append("section_8_watchlist must be an object with rising/falling arrays")

    for s in data.get("section_3_sectors", []):
        amt = s.get("flow_amount", "")
        if "X.X" in amt or amt in ("", None):
            issues.append(f"section_3_sectors {s.get('etf')} flow_amount is placeholder: {amt!r}")

    concl = data.get("section_8_conclusion", {})
    for key in ["thesis", "risks", "opportunities", "action"]:
        if not concl.get(key) or str(concl.get(key)).strip() == "":
            issues.append(f"section_8_conclusion.{key} is empty")

    if not data.get("markets"):
        issues.append("markets block missing")

    blacklist = ["אין חדשות", "אין עדכון", "לא זמין", "לא חלו שינויים", "ללא ידיעות", "אין מידע", "N/A"]
    raw_str = json.dumps(data, ensure_ascii=False)
    for phrase in blacklist:
        if phrase in raw_str:
            issues.append(f"Content contains blocked placeholder: {phrase}")

    return issues


def clean_raw(raw):
    """Strip markdown fences and control characters from Gemini output, then auto-repair JSON."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    raw = re.sub(r'[\x00-\x08\x0a-\x1f\x7f]', '', raw)
    raw = re.sub(r'[\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]', '', raw)
    raw = re.sub(r',\s*([\]}])', r'\1', raw)
    try:
        from json_repair import repair_json
        raw = repair_json(raw, return_objects=False)
    except ImportError:
        pass
    return raw


def deduplicate_sections(data):
    """Aggressive de-duplication — strip news entries that repeat hero/alert concepts."""
    seen_concepts = set()

    def extract_keywords(text):
        if not text:
            return set()
        return set(re.findall(r'\w{5,}', text.lower()))

    hero_text = (data.get("section_1_situation", {}).get("headline", "") + " " +
                 data.get("section_1_situation", {}).get("analysis", ""))
    seen_concepts.update(extract_keywords(hero_text))

    alert_text = data.get("section_1_situation", {}).get("alert_title", "")
    seen_concepts.update(extract_keywords(alert_text))

    ai_items = data.get("section_7_ai", [])
    for item in ai_items:
        upd = item.get("update", "")
        if upd:
            seen_concepts.update(extract_keywords(upd))

    news = data.get("section_2_news", [])
    filtered_news = []
    for item in news:
        head = item.get("headline", "")
        body = item.get("body", "")
        news_concepts = extract_keywords(head + " " + body)
        overlap = news_concepts.intersection(seen_concepts)
        if len(overlap) >= 2:
            print(f"[DEDUPE] Dropping duplicate news: {head[:40]}... (Overlap: {list(overlap)[:3]})")
            continue
        filtered_news.append(item)
    data["section_2_news"] = filtered_news

    crypto_text = data.get("section_5_crypto", {}).get("narrative", "")
    seen_concepts.update(extract_keywords(crypto_text))

    return data


def merge_prev_no_news(data, prev):
    """For section_7_ai: replace 'no news' entries with previous run's data."""
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
