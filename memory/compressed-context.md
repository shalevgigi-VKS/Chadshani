מטרת הפרויקט: ניהול וטיפול בפרויקטים מרובים — StickerBot, Chadshani, ועוד
השלב הנוכחי: סיום תיקוני StickerBot + עדכון Chadshani watchdog + סקירת מצב כלל הפרויקטים
החלטות מחייבות:
- StickerBot: שימוש ב-chatId (message.id.remote) לתמיכה ב-@lid ו-@c.us
- StickerBot: תור סינכרוני — worker אחד, job אחד בכל פעם
- Chadshani: ריצה 6 דקות לפני השעה + watchdog עם auto-retry ו-ntfy
רכיבים רלוונטיים:
- Shalev's_Projects/5_StickerBot/bot/index.js
- Shalev's_Projects/5_StickerBot/bot/sender.js
- .github/workflows/chadshani-2.yml
- .github/workflows/chadshani-watchdog.yml
מה הושלם:
- StickerBot: תור, הודעות אישור, תמיכה ב-@lid, תיקון צבעים (cv2 BGR)
- Chadshani: workflow_dispatch, cron 6min early, watchdog עם auto-retry
מה הצעד הבא:
- סקירת מצב כלל הפרויקטים ויצירת סוכן project-status
סיכונים:
- StickerBot: בוט רץ ב-background — צריך לוודא שהוא עדיין פעיל אחרי כל שינוי
