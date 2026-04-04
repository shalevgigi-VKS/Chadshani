מטרת הפרויקט: ניהול וטיפול בפרויקטים מרובים — StickerBot, Chadshani, Evolution, ועוד.
השלב הנוכחי: סיום סקירת סטטוס גלובלית + נעילת "חדשני" (Maintenance Mode) + ביטול גישה לנתונים שגויים.
החלטות מחייבות:
- Chadshani: האתר במצב תחזוקה. דורש API Key וסנכרון נתונים איכותי (יש להשתמש ב-fast_info).
- Chadshani: Deployment עכשיו מופעל גם ב-push (על התיקייה הייעודית). לעדכון HTML משתמשים ב-deploy-only.
- Gigiz: הפרויקט מוקפא לחלוטין (FROZEN). אין לנסות לבנות או לשנות.
- Project-Status: Ground Truth נמצא ב-PROJECT_STATUS.md וב-snapshot.json.
רכיבים רלוונטיים:
- Shalev's_Projects/2_Chadshani/index.html (Maintenance Page)
- .github/workflows/chadshani-deploy-only.yml (on: push added)
- Shalev's_Projects/8_EvolutionSchematic/data/snapshot.json
מה הושלם:
- יצירת PROJECT_STATUS.md ועדכון סוכן project-status הגלובלי.
- הטמעת מנגנון Lockdown לאתר "חדשני" ואימות הופעת עמוד תחזוקה.
- ביצוע סריקה מקיפה של 8 פרויקטים וסיווג הסטטוס שלהם.
מה הצעד הבא:
- החזרת "חדשני" לאוויר רק לאחר וידוא 100% דיוק נתונים והזנת API Key.
סיכונים:
- Chadshani: אין להפעיל מחדש את chadshani_auto.py ללא הזרקת מפתח API (אחרת הפריסה תיכשל על validation).
