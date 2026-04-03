# Chadshani — HANDOFF
Last updated: 2026-04-02

## מצב נוכחי (2026-04-02)
- האתר פועל ✅ — https://shalevgigi-vks.github.io/Chadshani/
- Task Scheduler: Chadshani-0645 + Chadshani-1845 רשומים ופועלים
- GEMINI_API_KEY מוגדר כ-User env var
- תקציב אפריל: ~₪0.65 / ₪20 (Google AI Studio — המספר הסמכותי)
- עלות ריצה: ~₪0.09 כולל thinking tokens
- flow_amount: מחושב מ-yfinance AUM (לא Gemini)
- section_7_ai: fallback לנתונים קודמים אם אין חדשות
- **סינון חדשות**: MAX_NEWS_AGE_DAYS=7 — RSS + yfinance מסננים פריטים ישנים מ-7 ימים+

## סטטוס: Active v3.2.6 ✅ (עודכן 2026-04-03)
האתר חי, מתועד במלואו, Task Scheduler רץ אוטומטית.

**v3.2.6 (2026-04-03):**
- OG/Twitter tags נוספו → link previews עובד
- notify() ensure_ascii=False → עברית עובדת באייפון
- CoinGecko fallback ל-TAO + KAS (yfinance TAO1-USD delisted)
- תיקון shutil.copy2 copy-to-self (PermissionError ב-Windows)
- ערכי מדדים ממורכזים (text-center)
- DATA_FETCHING_GUIDE.md + primer.md נוצרו

## כלל קריטי — אסור לפרוס ללא נתונים
**חדשני לא עולה לאוויר ללא עדכון מלא של כלל הנתונים באתר.**
סדר חובה: generate_json.py → validate → commit → push → deploy
אסור לעלות רק index.html ללא latest.json מעודכן באותה ריצה.

## החלטות מחייבות
- merge_with_previous הוסרה לחלוטין — אין זיוף נתונים
- Gemini Flash max 2 attempts, Pro max 1 — לא לשנות
- validate לפני deploy תמיד — הסדר: Generate → Validate → Meta inject → Deploy → Notify
- cron trigger בוטל משרתי GitHub — עדכונים מהמחשב בלבד

## מה הושלם
- תיקון 7 כללים קריטיים (rule 1-7 ב-feedback_chadshani_schedule_and_data.md)
- הסרת merge_with_previous
- תיקון yfinance לשימוש ב-fast_info.lastPrice
- Quality Control Skill נוצר: `~/.claude/skills/active/chadshani_quality_control.md`
- cron הוסר מ-GitHub Actions (2026-04-02)

## לא לשנות
- לוגיקת validation ב-chadshani-2.yml (שורות 59-135)
- PLACEHOLDERS list
- סדר השלבים בworkflow
