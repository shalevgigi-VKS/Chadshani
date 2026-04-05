# SYSTEM HANDOFF — תמונת מצב כוללת
Last updated: 2026-04-05 (session 2 — Chadshani pipeline fix + old workflow disabled)

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
| **2_Chadshani** | ✅ v4.0.0 — ענן | https://shalevgigi-vks.github.io/Chadshani/ — pipeline מאומת. exit 128 תוקן. chadshani-2.yml ישן מבוטל. cron יירה מחר 06:45 |
| **3_Notifications** | ✅ מושלם | תשתית ntfy.sh פועלת, לא דורש עבודה |
| **4_RemoteAccess** | ✅ מושלם | AnyDesk מוגדר, HKCU\\Run לUI |
| **5_StickerBot** | ✅ מושלם | פרויקט הושלם |
| **6_LinkToText** | 🔨 בפיתוח | linktotext.vercel.app — כל 4 strategies חסומות. CF Worker נחסם (429). Title fix בקוד, צריך build+deploy. Next: Webshare residential ($2.99) או bgutil po_token |
| **6_Gigiz** | ❌ מבוטל | לא יפותח — הוחלט לנטוש |
| **7_LCL** | ⏸ הושהה | TCS app בנוי במלואו, deployed ל-https://lcl-4b863.web.app — ממתין להפעלת Firebase Auth ידנית |
| **8_EvolutionSchematic** | ✅ פעיל — Vercel | https://evolution-schematic.vercel.app |
| **9_Kesem** | 🔨 בפיתוח | קסם הידיעה — single-file HTML, Claude Haiku API → תסריט AABB → Canvas cartoon + WebM 1280×720. קובץ: `Shalev's_Projects/9_Kesem/extracted/project-package/web-interface/index.html` |
| **10_TmunoteAI** | 🔨 בפיתוח | אפליקציית תמונות AI מקומית — Stable Diffusion v1.5, Flask web + CustomTkinter desktop, ללא API key. קובץ: `Shalev's_Projects/10_TmunoteAI/` |

---

## סוכני מערכת — Self-Evolving Layer

| סוכן | תפקיד | תדירות |
|------|--------|--------|
| **project-documenter** | שמירת מצב פרויקט ב-8 מקומות אחרי כל סשן | ידני + Stop hook (marker→shadow) |
| **gap-analyzer** | מדידת פער מ-dream-state + cross-project intelligence | ראשון 10:00 (system-optimizer) |
| **innovation-scout** | סריקת כלים חדשים ב-Context7/web | ידני + system-optimizer Phase 9 (חודשי) |
| **stale-docs-cleaner** | ניקוי קבצי מקור ישנים בפרויקטים ✅ | שעתי (Task Scheduler) |
| **system-optimizer** | שיפור מערכתי שבועי (9 שלבים) | ראשון 10:00 |
| **skills-auditor** | ביקורת שבועית על skills registries | ראשון 03:47 (ClaudeSkillsAudit) |

---

## Automation Hooks — מה אוטומטי (2026-04-04)

| Hook | Trigger | מה עושה |
|------|---------|---------|
| memory-heartbeat.sh | PostToolUse Write/Edit | logs entity_name=basename (תוקן: לא עוד "unknown") |
| git-prescan.sh | PreToolUse Bash(git commit) | סורק staged files לסודות לפני commit |
| file-size-check.sh | PostToolUse Write/Edit | מזהה קבצים גדולים → pending-review.md |
| context-save.sh | PreCompact | שומר compressed-context.md לסשן הבא |
| project-documenter-stop.sh | Stop | כותב pending-documentation marker אם פרויקטים השתנו |
| doc-updater-stop.sh | Stop | כותב pending-doc-update marker אם system files השתנו |
| shalev-patterns-capture.py | Stop | לוכד בקשות + 3x closed-loop → Draft skill |
| ClaudeSkillsAudit | ראשון 03:47 | ביקורת skills registries |
| ClaudeMonthlyBackup | 1 לחודש | ✅ קיים ומאומת |

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
