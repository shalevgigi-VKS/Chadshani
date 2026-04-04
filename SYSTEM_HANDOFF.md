# SYSTEM HANDOFF — תמונת מצב כוללת
Last updated: 2026-04-04

---

## מה המערכת הזו

Claude Code workspace לניהול פרויקטים אישיים, עם:
- מנגנוני זיכרון אוטומטי (memory/)
- Shadow Agent (סריקה בתחילת כל סשן)
- Skills + Agents מנוהלים
- HANDOFF.md בכל פרויקט

---

## מצב פרויקטים

| פרויקט | מצב | פרטים |
|---|---|---|
| **1_EmotionWheel** | ✅ מושלם | פרויקט הושלם |
| **2_Chadshani** | ✅ פעיל v3.3.11 | https://shalevgigi-vks.github.io/Chadshani/ — Task Scheduler 06:45 + 18:45 | 
| **3_Notifications** | ✅ מושלם | תשתית ntfy.sh פועלת, לא דורש עבודה |
| **4_RemoteAccess** | ✅ מושלם | AnyDesk מוגדר, HKCU\\Run לUI |
| **5_StickerBot** | ✅ מושלם | פרויקט הושלם |
| **6_Gigiz** | ❌ מבוטל | לא יפותח — הוחלט לנטוש |
| **7_LCL** | ⏸ הושהה | TCS app בנוי במלואו, deployed ל-https://lcl-4b863.web.app — ממתין להפעלת Firebase Auth ידנית |
| **8_EvolutionSchematic** | ✅ פעיל — Vercel | https://evolution-schematic.vercel.app |
| **9_Kesem** | 🔨 בפיתוח | קסם הידיעה — single-file HTML, Claude Haiku API → תסריט AABB → Canvas cartoon + WebM 1280×720. קובץ: `Shalev's_Projects/9_Kesem/extracted/project-package/web-interface/index.html` |

---

## החלטות מחייבות — מערכת

| החלטה | סיבה |
|---|---|
| מחשב מקומי = trigger יחיד לחדשני | אבטחה + אפס עלות GitHub Actions |
| GEMINI_API_KEY נשאר מקומי בלבד | לא עולה ל-GitHub Secrets |
| notification: פעם אחת, אחרי verify_deployment בלבד | כפי שנקבע ב-memory |
| exit 2 = Gemini נכשל → deploy מבוטל | לא פורסים נתונים ישנים עם timestamp חדש |
| BUDGET_ILS = 20 ← Google AI Studio cap | מסונכרן ידנית בכל שינוי cap |

---

## תקציב Gemini (אפריל 2026)

- **Google AI Studio:** ₪6.13 / ₪20 (30.6%)
- עלות ריצה: ~₪0.013 (flash-lite, thinking_budget=0)
- מתאפס ב-1 לחודש

---

## קבצים מרכזיים

| קובץ | מיקום |
|---|---|
| Memory Index | `~/.claude/projects/e--Claude/memory/MEMORY.md` |
| Chadshani HANDOFF | `Shalev's_Projects/2_Chadshani/HANDOFF.md` |
| Skills Registry | `~/.claude/docs/skills_registry.md` |
| Task Scheduler | `Shalev's_Projects/2_Chadshani/setup_tasks.ps1` |

---

## כיצד להתחיל סשן חדש

1. Shadow Agent רץ אוטומטית — קרא את הממצאים
2. פתח `SYSTEM_HANDOFF.md` — תראה את המצב העדכני
3. פתח `HANDOFF.md` של הפרויקט הרלוונטי
4. המשך
