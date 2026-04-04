# Chadshani — HANDOFF
Last updated: 2026-04-05

## מצב נוכחי
- האתר פועל ✅ — https://shalevgigi-vks.github.io/Chadshani/
- Task Scheduler: Chadshani-0645 + Chadshani-1845 רשומים ופועלים
- GEMINI_API_KEY מוגדר כ-User env var
- **תקציב אפריל: ₪6.10 / ₪20 (Google AI Studio — המספר הסמכותי)**
- עלות ריצה: ~₪0.013 לריצה (flash-lite, בלי thinking)
- סטטוס: **Active v3.3.13**

## v3.3.x — שדרוגים (2026-04-04/05)
- **v3.3.7** static Tailwind CSS, font preconnect, icon subset
- **v3.3.8** תיקוני עיצוב: south_east→trending_up/down, flow_direction heatmap, scroll instant, ללא pill-ticker כפול, crypto contrast, json_repair, Gemini fallback chain, UTF-8 stdout
- **v3.3.9** תיקון sidebar (custom .hidden override הוסר), CSS rebuild, bg-amber-100 נוסף
- **v3.3.10** כרטיס F&G קריפטו: רקע בהיר + כיתוב שחור (הוסר bg-slate-900)
- **v3.3.11** notification אחת בלבד אחרי אימות מלא, עם סכום חיוב | אסור לפרוס עם נתונים ישנים
- **v3.3.12** nav scroll fix (href→javascript:void), title=חדשני+גרסא, MAX_NEWS_AGE_DAYS=2, +8 finance RSS feeds (Reuters/CNBC/MarketWatch/Yahoo)
- **v3.3.13** רקע אינדיגו בהיר (#eef2ff), כותרות .page-h2 גדולות יותר + צבע לפי עמוד, תיקון טיקר מובייל (קפיצה בלופ + 4 עותקים ראשוניים), גיבוי v3.3.12

## כללי ברזל — אסור לשנות
1. **אסור לפרוס ללא נתונים חדשים** — generator exit 2 = deploy מבוטל, ntfy "דולג ⏭"
2. `merge_with_previous` הוסרה לחלוטין — אין זיוף נתונים
3. Gemini Flash-lite max 3 → Flash max 2 → Pro max 1 — לא לשנות את הספירות
4. validate לפני deploy תמיד
5. cron trigger בוטל משרתי GitHub — עדכונים מהמחשב בלבד
6. **notification אחת בלבד — רק אחרי `verify_deployment()` הצליח**

## ארכיטקטורת Gemini
```
gemini-2.5-flash-lite (3 ניסיונות)
    ↓ נכשל
gemini-2.5-flash (2 ניסיונות)
    ↓ נכשל
gemini-2.5-pro (1 ניסיון)
    ↓ נכשל
exit 2 → deploy מבוטל (לא fallback לנתונים ישנים)
```
- `max_output_tokens=32768` (הועלה מ-16384 כי Pro נחתך)
- `thinking_budget=0` (חוסך tokens, JSON לא צריך thinking)
- `json_repair` בתוך `clean_raw()` — מתקן פסיקים חסרים אוטומטית

## Notification Format
**הצלחה:** title=`חדשני — עודכן ✅` | body=`₪6.13 / ₪20` (+ אזהרות אם יש)
**דולג:** title=`חדשני — דולג ⏭` | body=`Gemini לא זמין | ₪6.10 / ₪20`
**תקציב מוצה:** title=`חדשני — תקציב מוצה ⛔` (נשלח מוקדם — חוסם ריצה)
**שגיאה:** title=`חדשני — [סוג שגיאה] ⚠️` (נשלח בכל שגיאה קריטית)

## תקציב
- `BUDGET_ILS = 20.0` — מסונכרן עם Google AI Studio cap
- כשה-cap יתמלא — כנס לאיסטודיו, העלה, ועדכן `BUDGET_ILS` בקוד
- ב-1 לחודש: הטראקר המקומי מתאפס אוטומטית (סכום לפי חודש בלבד)

## מה הושלם
- תיקון 7 כללים קריטיים (rule 1-7 ב-feedback_chadshani_schedule_and_data.md)
- הסרת merge_with_previous
- Quality Control Skill: `~/.claude/skills/active/chadshani_quality_control.md`
- cron הוסר מ-GitHub Actions
- סינון חדשות: MAX_NEWS_AGE_DAYS=7
- json_repair לתיקון JSON שבור של Gemini
- Gemini fallback chain + no-stale-deploy rule

## לא לשנות
- לוגיקת validation ב-chadshani_auto.py (שורות 155-213)
- PLACEHOLDERS list
- סדר שלבי workflow: Generate→Validate→Copy→GitAdd→Commit→Push→Verify→Notify
