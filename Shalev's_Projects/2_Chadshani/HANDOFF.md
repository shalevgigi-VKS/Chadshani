# Chadshani — HANDOFF
Last updated: 2026-04-02

## מצב נוכחי
- האתר פועל על GitHub Pages: https://shalevgigi-vks.github.io/Chadshani/
- נתונים מתעדכנים דרך `generate_json.py` (Gemini API + yfinance)
- workflow_dispatch בלבד — cron בוטל (2026-04-02)
- מפתחות API: GEMINI_API_KEY חייב להיות בסביבה המקומית

## הצעד הבא
- בחר: האם לבנות Task Scheduler מקומי (07:00 ו-19:00 IL) או להמשיך עם הרצה ידנית
- לאחר החלטה: אם Task Scheduler → הרץ `setup_task.ps1` כ-Admin (קיים ב-EvolutionSchematic כדוגמה)
- שלב הבא בפרויקט: שחזור v2 עם נתונים אמיתיים → ואז v3

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
