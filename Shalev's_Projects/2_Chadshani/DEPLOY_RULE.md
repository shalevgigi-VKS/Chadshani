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

---

## חוקי הפעלה קריטיים

### כלל: התראה רק אחרי אימות מלא
התראת "האתר מוכן" נשלחת ב-chadshani-2.yml **בלבד לאחר שעברו כל הבדיקות הבאות:**
1. generate_json.py הסתיים ללא שגיאה
2. אימות נתונים עבר (שלב `validate`) — כולל:
   - `generated_at` קיים
   - `section_1_situation.headline` לא ריק
   - `markets.sp500`, `markets.nasdaq`, `markets.vix` קיימים
   - כל מחירי המניות ב-section_5_semis / section_6_software לא placeholder
   - כל מחירי הקריפטו ב-section_4_crypto לא placeholder
   - section_2_news לפחות 4 פריטים
   - section_3_sectors ללא "X.X" ב-flow_amount
   - gauges.vix.value ערך מספרי
3. GitHub Pages deployment הושלם

אם האימות נכשל → נשלחת התראת **כישלון** (לא הצלחה), האתר עולה אך המשתמש מקבל אזהרה.

### כלל: ניקוי deployments כושלים
כל deployment ל-Vercel / Netlify / כל שירות חיצוני שנוצר כניסיון ונכשל — **חייב להימחק מיד** בסוף הניסיון.
אין להשאיר stale deployments פעילים. בדוק עם `npx vercel list` / ממשק השירות הרלוונטי.

היסטוריה: Vercel project `chadshani-2` נמחק ב-2026-03-28 — היה deployment שנותר פעיל מניסיון שנכשל.
