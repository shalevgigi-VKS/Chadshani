# Chadshani — HANDOFF
Last updated: 2026-04-05

## מצב נוכחי
- האתר פועל ✅ — https://shalevgigi-vks.github.io/Chadshani/
- **ארכיטקטורה: ענן מלא** — אין תלות במחשב מקומי
- GitHub Actions: cron 03:45 + 15:45 UTC (= 06:45 + 18:45 Israel)
- Cloudflare Worker: https://chadshani-telegram.shalev-gigi.workers.dev — Telegram webhook פעיל
- GEMINI_API_KEY: GitHub Secrets
- TELEGRAM_BOT_TOKEN + GITHUB_PAT + GITHUB_REPO + WORKFLOW_FILE: CF Worker Secrets
- **תקציב אפריל: ~₪6.28 / ₪20 (Google AI Studio — המספר הסמכותי)**
- עלות ריצה: ~₪0.013 לריצה (flash-lite, בלי thinking)
- סטטוס: **Active v4.0.0 — Cloud**

## ארכיטקטורה סופית
```
06:45 / 18:45 (ישראל) → GitHub Actions cron → Gemini → deploy GitHub Pages ✅
"תעדכן אותי" → Telegram → Cloudflare Worker → GitHub workflow_dispatch → GitHub Actions ✅
מחשב: לא נדרש לשום דבר ✅
```

## Cloud Migration (2026-04-05)

### GitHub Actions — chadshani-update.yml (חדש)
- קובץ: `.github/workflows/chadshani-update.yml`
- cron: `45 3,15 * * *` (UTC) = 06:45 + 18:45 ישראל
- Pipeline: checkout → pip install → generate_json.py → validate → git commit (latest.json + cost_log.json) → inject INLINE_DATA → deploy GitHub Pages → ntfy
- exit 2 = דולג ⏭ (Gemini failed), exit 1 = שגיאה ⚠️, exit 0 = עודכן ✅

### chadshani-deploy-only.yml — push trigger הוסר
- נשאר workflow_dispatch בלבד (ידני)
- הוחלף על-ידי chadshani-update.yml לכל דבר אוטומטי

### Cloudflare Worker
- Worker name: chadshani-telegram
- URL: https://chadshani-telegram.shalev-gigi.workers.dev
- קובץ מקור: `Shalev's_Projects/2_Chadshani/chadshani_cloudflare_worker.js`
- wrangler.toml: `Shalev's_Projects/2_Chadshani/wrangler.toml`
- triggers: "עדכן" / "תעדכן" / "update" / "עדכון"
- שולח GitHub workflow_dispatch → מפעיל chadshani-update.yml
- עונה "מעדכן... ⏳" מיד, ntfy יגיע בסיום

### Task Scheduler — ניקוי
- נמחקו: Chadshani-0645, Chadshani-1845, chadshani-watchdog-0800, chadshani-watchdog-2000, ChadshaniTelegramBot
- נשארו (לא ניתן למחוק ללא admin — לא מסוכנות, מצביעות לנתיב ישן שלא קיים):
  - chadshani-0600, chadshani-1200, chadshani-2030 → כשלות בשקט

### Telegram Bot Migration
- chadshani_telegram_bot.py + start_telegram_bot.bat: נשמרים כ-backup בגיט — לא רצים
- Webhook הועבר ל-Worker (polling הופסק)
- Bot: newsdesgSG_bot, Chat ID: -1003840479051

### Git Commits (cloud migration)
- `914717f` — feat(chadshani): cloud migration — GitHub Actions cron + Cloudflare Worker
- `749a87e` — feat(chadshani): add wrangler.toml for Cloudflare Worker

### אימות סופי
- ✅ GitHub Actions ריצה ראשונה: completed/success (2026-04-05T03:15:12Z)
- ✅ Telegram webhook: URL נכון, אין שגיאות
- ✅ GEMINI_API_KEY ב-GitHub Secrets
- ✅ 5 משימות Task Scheduler נמחקו

## v4.0.0 — השקה (2026-04-04)
- **Liquid Glass design** — Apple-inspired glass cards עם backdrop-filter + gradient
- **Teal theme** — החלפת indigo ב-teal (#0d9488) בכל האתר
- **3D tilt fix** — perspective על parent div (לא על backdrop-filter element) — עובד!
- **Entrance animations** — fadeInUp staggered על כל כרטיס
- **Dashboard status bar** — שעה / עדכון אחרון / עדכון הבא / מצב בורסה
- **גיבוי v3.3.13** — index_backup_v3.3.13.html + index_template_backup_v3.3.13.html
- **ניקיון מלא** — הוסרו: קורסלה (11 תמונות), ORIGINAL backup, v3.3.12 backups, index_maintenance
- **Microsoft/Copilot** נוסף ל-section_7_ai + GNews RSS
- **תיקון dedup** — threshold 4, seed מ-alert.title בלבד
- **תיקון gemini-2.5-pro** — מדלג על thinking_budget=0 (Pro דורש thinking mode)
- **gemini-2.5-flash-lite** מפתח מפורש ב-_PRICING dict

## 2026-04-05 — שדרוגים (לפני cloud migration)

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
5. **notification אחת בלבד — רק אחרי `verify_deployment()` הצליח**
6. **GEMINI_API_KEY: GitHub Secrets בלבד**
7. **TELEGRAM_BOT_TOKEN + GITHUB_PAT: CF Worker Secrets בלבד**
8. בחורף (נוב-פבר): cron shifts UTC+2 → 04:45 + 16:45 UTC — נורמלי

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
- [x] cron הוסר מ-GitHub Actions (ישן)
- [x] סינון חדשות: MAX_NEWS_AGE_DAYS=7
- [x] json_repair לתיקון JSON שבור של Gemini
- [x] Gemini fallback chain + no-stale-deploy rule
- [x] v4.0.0 השקה: Liquid Glass, teal, 3D tilt, entrance animations, status bar
- [x] section_7_ai עיצוב מחדש: 14 per-product cards עם 5 updates כל אחד
- [x] Microsoft נוסף ל-GROUPS["others"] (באג תוקן)
- [x] +4 RSS feeds חדשים (Claude Code, ChatGPT, Codex, AI Studio)
- [x] ביצועים מובייל: fonts non-render-blocking + lazy load
- [x] Scroll-to-top iOS Safari fix
- [x] Cloud migration: GitHub Actions cron + Cloudflare Worker Telegram
- [x] Task Scheduler ניקוי: 5 משימות נמחקו
- [x] Telegram polling → Cloudflare Worker webhook

## מה נשאר
- [ ] WebP conversion לתמונות פרופיל (SHALEV.PNG 2.7MB → target < 200KB)
- [ ] 3 משימות ישנות (chadshani-0600/1200/2030) — לא ניתן למחוק ללא admin, לא מסוכנות
- [ ] 확인 3D tilt + spotlight על small cards בכל גדלי מסך
- [ ] הרחבת Others: Mistral, Cohere, Stability AI

## החלטות שהתקבלו

| החלטה | סיבה |
|-------|------|
| Cloud migration — GitHub Actions + CF Worker | אפס תלות במחשב מקומי — uptime 100% ללא פעולת משתמש |
| GEMINI_API_KEY → GitHub Secrets | הדרך הבטוחה לגיט; Actions יש לו גישה ישירה |
| TELEGRAM_BOT_TOKEN → CF Worker Secrets | לא עולה לגיט בשום צורה |
| GITHUB_PAT → CF Worker Secrets | workflow_dispatch צריך PAT; לא עולה לגיט |
| polling bot נשמר כ-backup בגיט | שיחזור אפשרי אם Worker ייפול |
| cron 03:45 + 15:45 UTC | = 06:45 + 18:45 ישראל קיץ (UTC+3); DST shifts 1h in winter |
| updates_count 10→5 פר מוצר | תוכן ממוקד יותר, פחות עומס Gemini |
| others grid: grid-cols-2 lg:grid-cols-3 | 4 כרטיסים, 2 בשורה במובייל, 3 בדסקטופ |
| fonts preload/onload (לא render-blocking) | FCP שיפור משמעותי במובייל |
| perspective על parent div (לא backdrop element) | Chrome: backdrop-filter creates stacking context — perspective על אותו element לא עובד |

## כיצד להמשיך בסשן חדש

1. קרא קובץ זה
2. בדוק תקציב: `cat "e:/Claude/Shalev's_Projects/2_Chadshani/data/cost_log.json"`
3. לעדכון ידני: GitHub Actions → chadshani-update.yml → Run workflow (או שלח "עדכן" לבוט)
4. לשינוי CSS: ערוך index_template.html → rebuild CSS → sync index.html
5. לבדיקת generate_json.py מקומית: הגדר GEMINI_API_KEY כ-env var ואז הרץ

## קבצים רלוונטיים

```
.github/workflows/chadshani-update.yml        — GitHub Actions pipeline (ראשי)
.github/workflows/chadshani-deploy-only.yml   — manual deploy only (workflow_dispatch)
chadshani_generator.py                         — Gemini API calls + RSS fetching
chadshani_processing.py                        — data processing + validation
chadshani_constants.py                         — schema, RSS feeds, pricing, GROUPS definition
chadshani_cloudflare_worker.js                 — Cloudflare Worker source (Telegram → GitHub)
wrangler.toml                                  — CF Worker deployment config
chadshani_telegram_bot.py                      — backup: polling bot (לא פעיל)
start_telegram_bot.bat                         — backup: wrapper לבוט (לא פעיל)
index_template.html                            — מקור האמת לעיצוב
index.html                                     — עותק סינכרוני מ-template (מה שנפרס)
data/latest.json                               — נתוני הריצה האחרונה
data/cost_log.json                             — tracking תקציב Gemini
assets/CHADSHANI_LOGO_v4.png                   — לוגו OG
assets/SHALEV2.png                             — תמונת פרופיל (1.8MB — lazy loaded)
```
