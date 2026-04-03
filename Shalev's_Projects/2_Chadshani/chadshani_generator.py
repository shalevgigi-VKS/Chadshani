"""
Chadshani generator — Gemini call, cost logging, orchestration.
Entry point: generate()
"""
import json
import os
import sys
import time
from datetime import datetime

from chadshani_constants import (
    client, SYSTEM_PROMPT, JSON_PROMPT, COST_LOG, _PRICING, USD_TO_ILS,
)
from chadshani_fetchers import build_news_context
from chadshani_processing import patch_prices, validate, clean_raw, deduplicate_sections, merge_prev_no_news
from google.genai import types


def _load_cost_log():
    if os.path.exists(COST_LOG):
        with open(COST_LOG, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"runs": [], "total_usd": 0.0, "total_ils": 0.0}


def _save_cost_log(log):
    with open(COST_LOG, "w", encoding="utf-8") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)


def log_cost(model, usage):
    """Calculate and persist cost including thinking tokens."""
    try:
        p = _PRICING.get(model, _PRICING["gemini-2.5-flash"])
        in_tok    = getattr(usage, "prompt_token_count", 0) or 0
        out_tok   = getattr(usage, "candidates_token_count", 0) or 0
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
        print(f"[COST] in={in_tok} out={out_tok}{think_note} | run=${cost_usd:.5f}/₪{cost_ils:.4f}")
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
            max_output_tokens=32768,
            response_mime_type="application/json",
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )
    if hasattr(response, "usage_metadata"):
        log_cost(model, response.usage_metadata)
    return response


def _load_previous():
    """Load the last written latest.json, or return empty dict."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "latest.json")
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def generate():
    prev = _load_previous()
    news_context, fear_greed, market_prices = build_news_context()

    MODEL_ATTEMPTS = [
        ("models/gemini-2.5-flash-lite", 3),
        ("models/gemini-2.5-flash", 2),
        ("models/gemini-2.5-pro", 1),
    ]

    data = None
    for model, max_att in MODEL_ATTEMPTS:
        for attempt in range(max_att):
            try:
                response = call_gemini(model, attempt, news_context)
                raw = clean_raw(response.text)
                candidate = json.loads(raw)
                candidate = patch_prices(candidate, market_prices=market_prices, fear_greed=fear_greed)
                candidate = merge_prev_no_news(candidate, prev)
                candidate = deduplicate_sections(candidate)
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
        if prev:
            print("[FALLBACK] Using last known good latest.json — refreshing timestamp only")
            data = prev
            data["generated_at"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            data["_fallback"] = True
        else:
            print("ERROR: All models exhausted and no fallback available")
            sys.exit(1)

    data["generated_at"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "latest.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[OK] latest.json written — {data['generated_at']}")


if __name__ == "__main__":
    generate()
