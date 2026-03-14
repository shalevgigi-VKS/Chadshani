# Primer — מצב הפרויקט הנוכחי

> קובץ זה נכתב מחדש בסוף כל סשן על ידי קלוד.

מטרת הפרויקט: בניית מערכת Claude Code מלאה — חסכונית בטוקנים, מבוססת סוכנים, עם זיכרון קבוע בין סשנים.

השלב הנוכחי: שכבה 5 (חדשני) הושלמה — Pipeline מלא פועל.

החלטות מחייבות:
- CLI קודם לכל
- תמיד קטן ויציב — לא מתקדמים לפני יציבות
- Apify הוחלף ב-yt-dlp+whisper (חינמי, מקומי)
- סוכנים ממומשים כ-.claude/commands/
- חדשני: Gemini CLI (לא Claude) לסריקת חדשות — יש לו Google Search

מה הושלם:
- שכבה 0: CLAUDE.md (3 חלקים: זהות, מנהל, דוחס)
- שכבה 1: Gemini CLI 0.33.1, Whisper 20250625, youtube_transcribe.py
- שכבה 2: primer.md, memory/, memory.sh, git repo + post-commit hook
- שכבה 3: /manager, /compactor
- שכבה 4: /extract, /anti-hallucination, /latest-docs, /security-audit
- שכבה 5: חדשני — pipeline מלא (generate_news.py → generate_website.py → Telegram)
- שכבה 6: /research-agent, /project-manager, /file-manager, /skill-tester (placeholders)

שכבה 5 — חדשני (chadshani/):
- generate_news.py: קורא Gemini CLI עם chadshani_prompt.txt → temp_news.txt
- chadshani_prompt.txt: 10 סעיפים (0=מדד פחד, 1-9=חדשות)
- scheduler.py: 07:00/14:30/21:00 + טלגרם trigger + cooldown 5 דקות
- generate_website.py: parser → HTML → GitHub Pages → Telegram
- website/index.html: פסטל, Heebo, gauge SVG, sidebar, copy/export
- .env: credentials (לא ב-git)

פקודות זמינות (/):
manager, compactor, extract, anti-hallucination, latest-docs, security-audit,
research-agent, project-manager, file-manager, skill-tester

ממתין:
- שלב 18: ייצוא NotebookLM (ידני) → /extract
- שלב 19: conversations.json מ-ChatGPT → /extract
- חדשני: עדכון GITHUB_USER ב-.env לפני push ראשון
- חדשני: הפעלת scheduler.py ממסוף חיצוני (לא מ-Claude Code)

סיכונים:
- Gemini CLI דורש gemini auth עם API key
- whisper.exe לא ב-PATH (עובד: python -m whisper)
- Telegram token חשוף בgit history — לשקול rotation ב-@BotFather
- scheduler.py: אסור להפעיל מתוך Claude Code session (nested sessions)
