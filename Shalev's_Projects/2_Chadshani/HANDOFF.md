# Chadshani — HANDOFF
Last updated: 2026-04-05

## מצב נוכחי
- האתר פועל ✅ — https://shalevgigi-vks.github.io/Chadshani/
- Task Scheduler: Chadshani-0645 + Chadshani-1845 + ChadshaniTelegramBot רשומים ופועלים
- GEMINI_API_KEY מוגדר כ-User env var
- TELEGRAM_BOT_TOKEN + TG_CHAT_ID מוגדרים כ-User env vars
- **תקציב אפריל: ~₪6.28 / ₪20 (Google AI Studio — המספר הסמכותי)**
- עלות ריצה: ~₪0.013 לריצה (flash-lite, בלי thinking)
- סטטוס: **Active v4.0.0**
- בוט טלגרם: newsdesgSG_bot פועל (PID 20688), Chat ID: -1003840479051

## v4.0.0 — השקה (2026-04-04)
- **Liquid Glass design** — Apple-inspired glass cards עם backdrop-filter + gradient
- **Teal theme** — החלפת indigo ב-teal (#0d9488) בכל האתר
- **3D tilt fix** — perspective על parent div (לא על backdrop-filter element) — עובד!
- **Entrance animations** — fadeInUp staggered על כל כרטיס
- **Dashboard status bar** — שעה / עדכון אחרון / עדכון הבא / מצב בורסה
- **גיבוי v3.3.13** — index_backup_v3.3.13.html + index_template_backup_v3.3.13.html
- **ניקיון מלא** — הוסרו: קורסלה (11 תמונות), ORIGINAL backup, v3.3.12 backups, index_maintenance
- **Microsoft/Copilot** נוסף ל-section_7_ai + GNews RSS
- **תיקון dedup** — threshold 4, seed מ-alert.title בלבד (לא מכל ה-analysis)
- **תיקון gemini-2.5-pro** — מדלג על thinking_budget=0 (Pro דורש thinking mode)
- **gemini-2.5-flash-lite** מפתח מפורש ב-_PRICING dict

## 2026-04-05 — שדרוגים

### section_7_ai — עיצוב מחדש לכרטיסים פר-מוצר
- 7 כניסות חברה → **14 כניסות פר-מוצר**
  - Anthropic: company news + Claude + Claude Cowork + Claude Code
  - OpenAI: company news + ChatGPT + Codex
  - Google: company news + Gemini + AI Studio & NotebookLM
  - Others: xAI/Grok, Meta/Llama, Perplexity, Microsoft/Copilot
- updates_count: 10 → 5 פר כניסה (ממוקד)
- +4 RSS feeds חדשים: Claude Code, ChatGPT, Codex, AI Studio
- Microsoft נוסף ל-JS GROUPS["others"] keys (חסר לפני — באג תוקן)
- others grid: grid-cols-2 lg:grid-cols-3

### ביצועים (מובייל)
- Google Fonts + Material Symbols: לא-חוסמי-רינדור (preload/onload trick)
- SHALEV.PNG (2.7MB) + SHALEV2.png (1.8MB): loading="lazy" נוסף

### תיקון Scroll-to-top
- iOS Safari: עכשיו מגדיר window + documentElement + body scrollTop ביחד
- Refresh: כבר מכריח macro page בטעינה

### בוט טלגרם — newsdesgSG_bot
- קובץ: `chadshani_telegram_bot.py` — מדגם Telegram, מפעיל chadshani_auto.py על "תעדכן"/"עדכן"/"update"
- Wrapper: `start_telegram_bot.bat` עם env vars בתוכו
- Task Scheduler: `ChadshaniTelegramBot` רשום, רץ בלוגאון (pythonw, ללא קונסול)
- 409 backoff: 35s
- **TELEGRAM_BOT_TOKEN נשאר מקומי בלבד** — אסור לכתוב בקוד .py

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
7. **TELEGRAM_BOT_TOKEN מקומי בלבד** — bat file, לא hardcoded ב-.py

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
- [x] תיקון 7 כללים קריטיים (rule 1-7 ב-feedback_chadshani_schedule_and_data.md)
- [x] הסרת merge_with_previous
- [x] Quality Control Skill: `~/.claude/skills/active/chadshani_quality_control.md`
- [x] cron הוסר מ-GitHub Actions
- [x] סינון חדשות: MAX_NEWS_AGE_DAYS=7
- [x] json_repair לתיקון JSON שבור של Gemini
- [x] Gemini fallback chain + no-stale-deploy rule
- [x] v4.0.0 השקה: Liquid Glass, teal, 3D tilt, entrance animations, status bar
- [x] section_7_ai עיצוב מחדש: 14 per-product cards עם 5 updates כל אחד
- [x] Microsoft נוסף ל-GROUPS["others"] (באג תוקן)
- [x] +4 RSS feeds חדשים (Claude Code, ChatGPT, Codex, AI Studio)
- [x] ביצועים מובייל: fonts non-render-blocking + lazy load
- [x] Scroll-to-top iOS Safari fix
- [x] Telegram bot: newsdesgSG_bot, Task Scheduler, tested

## מה נשאר
- [ ] WebP conversion לתמונות פרופיל (SHALEV.PNG 2.7MB → target < 200KB)
- [ ] Telegram bot crash watchdog (כרגע: רק Task Scheduler logon)
- [ ] 확인 3D tilt + spotlight על small cards בכל גדלי מסך
- [ ] הרחבת Others: Mistral, Cohere, Stability AI

## החלטות שהתקבלו

| החלטה | סיבה |
|-------|------|
| TELEGRAM_BOT_TOKEN בלבד ב-bat file | אבטחה — לא hardcoded ב-.py שעולה ל-git |
| updates_count 10→5 פר מוצר | תוכן ממוקד יותר, פחות עומס Gemini |
| others grid: grid-cols-2 lg:grid-cols-3 | 4 כרטיסים, 2 בשורה במובייל, 3 בדסקטופ |
| fonts preload/onload (לא render-blocking) | FCP שיפור משמעותי במובייל |
| 409 backoff: 35s | Telegram API: מחכה לסגירת connections ישנות |
| perspective על parent div (לא backdrop element) | Chrome: backdrop-filter creates stacking context — perspective על אותו element לא עובד |

## כיצד להמשיך בסשן חדש

1. קרא קובץ זה
2. בדוק תקציב: `cat "e:/Claude/Shalev's_Projects/2_Chadshani/data/cost_log.json"`
3. בוט: אם לא רץ — double-click `start_telegram_bot.bat`
4. לשינוי CSS: ערוך index_template.html → rebuild CSS → sync index.html
5. לבדיקת ריצה ידנית: `python chadshani_auto.py` ממסוף חיצוני (לא מתוך Claude Code)

## קבצים רלוונטיים

```
chadshani_auto.py          — אוטומציה ראשית (generate→validate→deploy→notify)
chadshani_generator.py     — Gemini API calls + RSS fetching
chadshani_processing.py    — data processing + validation
chadshani_constants.py     — schema, RSS feeds, pricing, GROUPS definition
chadshani_telegram_bot.py  — Telegram polling bot (triggers auto.py on demand)
start_telegram_bot.bat     — wrapper לבוט עם env vars
index_template.html        — מקור האמת לעיצוב
index.html                 — עותק סינכרוני מ-template (מה שנפרס)
data/latest.json           — נתוני הריצה האחרונה
data/cost_log.json         — tracking תקציב Gemini
assets/CHADSHANI_LOGO_v4.png — לוגו OG
assets/SHALEV2.png         — תמונת פרופיל (1.8MB — lazy loaded)
```
