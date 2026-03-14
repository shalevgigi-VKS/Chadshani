# Primer — מצב הפרויקט הנוכחי

> קובץ זה נכתב מחדש בסוף כל סשן על ידי קלוד.

מטרת הפרויקט: בניית מערכת Claude Code מלאה — חסכונית בטוקנים, מבוססת סוכנים, עם זיכרון קבוע בין סשנים.

השלב הנוכחי: הליבה הושלמה — ממתין לשכבה 5 (חדשני) ושלבים 18-19 (ייצוא נתונים).

החלטות מחייבות:
- CLI קודם לכל
- תמיד קטן ויציב — לא מתקדמים לפני יציבות
- Apify הוחלף ב-yt-dlp+whisper (חינמי, מקומי)
- סוכנים ממומשים כ-.claude/commands/
- שכבה 5 (חדשני) ממתינה לסיום שאר השכבות

מה הושלם:
- שכבה 0: CLAUDE.md (3 חלקים: זהות, מנהל, דוחס)
- שכבה 1: Gemini CLI 0.33.1, Whisper 20250625, youtube_transcribe.py
- שכבה 2: primer.md, memory/, memory.sh, git repo + post-commit hook
- שכבה 3: /manager, /compactor
- שכבה 4: /extract, /anti-hallucination, /latest-docs, /security-audit
- שכבה 6: /research-agent, /project-manager, /file-manager, /skill-tester (placeholders)

פקודות זמינות (/):
manager, compactor, extract, anti-hallucination, latest-docs, security-audit,
research-agent, project-manager, file-manager, skill-tester

ממתין:
- שלב 18: ייצוא NotebookLM (ידני) → /extract
- שלב 19: conversations.json מ-ChatGPT → /extract
- שכבה 5: פרויקט חדשני (scheduler + website + Telegram)

סיכונים:
- Gemini CLI דורש gemini auth עם API key
- whisper.exe לא ב-PATH (עובד: python -m whisper)
