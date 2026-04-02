# SYSTEM HANDOFF — תמונת מצב כוללת
Last updated: 2026-04-02

---

## מה המערכת הזו

Claude Code workspace לניהול פרויקטים אישיים, עם:
- מנגנוני זיכרון אוטומטי (memory/)
- Shadow Agent (סריקה בתחילת כל סשן)
- Skills + Agents מנוהלים
- HANDOFF.md בכל פרויקט

---

## מצב פרויקטים

| פרויקט | מצב | הצעד הבא |
|---|---|---|
| **2_Chadshani** | פעיל — cron בוטל 2026-04-02 | הרץ `setup_tasks.ps1` כ-Admin לרשום Task Scheduler |
| **8_EvolutionSchematic** | לא יציב — דורש refactor | Vercel migration + תיקון iPhone 404 |
| **1_EmotionWheel** | לא פעיל | ממתין להנחיה |
| **3_Notifications** | פועל — ntfy.sh | תשתית בסדר, אין עבודה |
| **5_StickerBot** | לא ידוע | בדוק npm start לפני גישה |
| **6_Gigiz** | **מוקפא** | אסור לגעת עד הנחיה מפורשת |
| **7_WhaleWatcher** | ריק | לא התחיל |

---

## Roadmap מאושר (לפי סדר)

1. ✅ ~~תיקון trigger חדשני (cron → local)~~
2. ✅ ~~Quality Control Skill~~
3. ✅ ~~HANDOFF.md לכל פרויקט~~
4. ✅ ~~Task Scheduler נרשם: Chadshani-0645, Chadshani-1845~~
5. ✅ ~~Budget guard + cost בכל notification~~
6. ✅ ~~האתר חזר לאוויר (200 OK)~~
7. **⬅ כאן עצרנו** — הגדר GEMINI_API_KEY (ראה מטה) → ריצה ב-18:45 היום תאמת הכל
8. שדרוג חדשני v3
9. תיקון + deploy אבולוציה (Vercel migration)
6. תיקון + deploy אבולוציה (Vercel migration)
7. חדשני v3

---

## החלטות מחייבות — מערכת

| החלטה | סיבה |
|---|---|
| מחשב מקומי = trigger יחיד לחדשני | אבטחה + אפס עלות GitHub Actions |
| GEMINI_API_KEY נשאר מקומי בלבד | לא עולה ל-GitHub Secrets |
| OpenRouter / Agent Reach / CLI tools — **לא** | לא הוכח ערך, מוסיף סיכון תלות |
| HANDOFF.md בכל פרויקט | session continuity — לא לזכרון ארוך-טווח |
| notification: עברית, פעם אחת, אחרי הצלחה בלבד | כפי שנקבע ב-memory |

---

## קבצים מרכזיים — מיקומים חשובים

| קובץ | מיקום |
|---|---|
| Memory Index | `~/.claude/projects/e--Claude/memory/MEMORY.md` |
| Skills Registry | `~/.claude/docs/skills_registry.md` |
| Shadow Agent | `~/.claude/modes/shadow_agent_mode.md` |
| QC Skill (חדשני) | `~/.claude/skills/active/chadshani_quality_control.md` |
| chadshani workflow | `.github/workflows/chadshani-2.yml` |
| Task Scheduler setup | `Shalev's_Projects/2_Chadshani/setup_tasks.ps1` |

---

## פעולה אחת נדרשת ממך

```powershell
# הגדר GEMINI_API_KEY (פעם אחת, PowerShell רגיל):
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY','YOUR_KEY_HERE','User')
```

לאחר מכן Tasks יריצו `chadshani_auto.py` אוטומטית ב-06:45 וב-18:45 כל יום.

⚠️ **מצב תקציב:** כבר נוצלו **15.44₪ מתוך 20₪** (77%) — נשארו ~38 ריצות.
כשיגיע ל-18₪ (90%) תקבל התראה. כשיגיע ל-20₪ הריצות נעצרות אוטומטית.

---

## כיצד להתחיל סשן חדש

1. Shadow Agent רץ אוטומטית — קרא את הממצאים
2. פתח `SYSTEM_HANDOFF.md` (קובץ זה) — תראה היכן עצרת
3. פתח `HANDOFF.md` של הפרויקט הרלוונטי
4. המשך מ-"⬅ כאן עצרנו"
