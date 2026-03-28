# חוק ה-Deploy — חדשני

## חוק ברזל: אין לבזבז Gemini API על שינויי עיצוב

### שינוי HTML / עיצוב / CSS / JS
→ **השתמש ב: "Chadshani — Deploy Only"**
→ GitHub Actions → Manual trigger → chadshani-deploy-only.yml
→ פעולה: מעלה את האתר בלבד, ללא קריאה ל-Gemini
→ עלות: $0

### עדכון נתונים (אוטומטי בלבד)
→ **chadshani-2.yml — SCHEDULE ONLY — לא מפעילים ידנית**
→ פועל: 07:00 / 13:00 / 20:00 שעון ישראל
→ קורא ל-Gemini + yfinance + מעלה אתר
→ עלות: מהמגבלה של 20 ₪

## תהליך שינוי עיצוב
1. ערוך `index.html` מקומית
2. `git push`
3. GitHub Actions → run `chadshani-deploy-only.yml`
4. קבל התראה ב-ClaudeCode כשסיים
