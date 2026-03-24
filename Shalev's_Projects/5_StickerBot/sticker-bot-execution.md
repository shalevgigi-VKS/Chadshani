# StickerBot — מסמך ביצוע

לפני תחילת הבנייה: קרא את כל המסמך, זהה נקודות לשיפור, בדוק שאין כפילויות או חוסרים לוגיים, ורק אחרי אישור פנימי של התוכנית — התחל לבנות.

---

## 1. תיאור

מערכת שמקבלת תמונת גריד של דמות אחת עם הרבה הבעות פנים, חותכת כל פאנל בנפרד, מסירה רקע, מוסיפה פס לבן דק, וממירה ל-WebP תקני של מדבקת WhatsApp. הממשק הוא בוט WhatsApp — שולחים תמונה, מקבלים חזרה את כל המדבקות ישירות לצ'אט.

---

## 2. מבנה קבצים

```
StickerBot/
├── bot/
│   ├── index.js          # נקודת כניסה — בוט whatsapp-web.js
│   ├── sender.js         # לוגיקת שליחת מדבקות עם השהייה
│   └── session/          # תיקיית session של WhatsApp (נוצרת אוטומטית)
├── processor/
│   ├── process.py        # נקודת כניסה — מקבל נתיב תמונה, מחזיר JSON עם נתיבי פלט
│   ├── grid_detector.py  # זיהוי וחיתוך פאנלים מהגריד
│   ├── bg_remover.py     # הסרת רקע עם rembg
│   └── sticker_maker.py  # הוספת פס לבן + המרה ל-WebP 512x512
├── tmp/                  # קבצים זמניים (נמחקים אחרי שליחה)
├── .env                  # משתני סביבה
├── package.json
└── requirements.txt
```

---

## 3. טכנולוגיות

| כלי | גרסה | תפקיד |
|-----|------|--------|
| Node.js | 18+ | runtime לבוט |
| whatsapp-web.js | latest | חיבור לWhatsApp ושליחת מדבקות |
| qrcode-terminal | latest | הצגת QR בטרמינל בהתחברות ראשונה |
| Python | 3.10+ | עיבוד תמונה |
| opencv-python | latest | זיהוי גריד וחיתוך פאנלים |
| rembg | latest | הסרת רקע (מודל u2net) |
| Pillow | latest | הוספת פס לבן, המרה ל-WebP |
| onnxruntime | latest | תלות של rembg |

---

## 4. זרימה מרכזית

```
[משתמש שולח תמונה לבוט]
        ↓
index.js מקבל message, בודק שזה תמונה
        ↓
שומר תמונה ל-tmp/input_<timestamp>.jpg
        ↓
קורא: python processor/process.py tmp/input_<timestamp>.jpg
        ↓
grid_detector.py מזהה שורות ועמודות לפי רווחים לבנים
חותך כל פאנל ושומר ל-tmp/panels/
        ↓
bg_remover.py מריץ rembg על כל פאנל → PNG שקוף
        ↓
sticker_maker.py מוסיף stroke לבן 8px, ממיר ל-WebP 512x512
שומר ל-tmp/stickers/sticker_01.webp, sticker_02.webp ...
        ↓
process.py מחזיר JSON: ["tmp/stickers/sticker_01.webp", ...]
        ↓
sender.js שולח כל קובץ כ-sticker למספר הקבוע
השהייה של 500ms בין כל שליחה
        ↓
שולח הודעת אישור: "נשלחו X מדבקות"
        ↓
מוחק את כל תיקיית tmp/panels ו-tmp/stickers
(קובץ הקלט נשמר ל-tmp/archive לתיעוד)
```

---

## 5. משתני סביבה

קובץ `.env` בשורש הפרויקט:

```env
# מספר היעד לשליחת המדבקות — כולל קידומת מדינה ללא +
# דוגמה: 972501234567@c.us
TARGET_NUMBER=972XXXXXXXXX@c.us

# השהייה בין שליחת מדבקות במילישניות
STICKER_DELAY_MS=500

# שם המחבר שמופיע במטא-דאטה של המדבקה
STICKER_AUTHOR=Osher

# שם הפאק שמופיע במטא-דאטה של המדבקה
STICKER_PACK=Osher Stickers
```

---

## 6. אבטחה

- קובץ `.env` חייב להיות ב-`.gitignore` — לא להעלות לgit
- תיקיית `bot/session/` חייבת להיות ב-`.gitignore` — מכילה credentials של WhatsApp
- לאחר קבלת תמונה לבדוק שהיא תמונה בלבד לפני שמורידים לדיסק — `message.type === 'image'`
- גודל תמונה מקסימלי: לדחות קבצים מעל 20MB
- ניקוי tmp אחרי כל עיבוד — לא לצבור קבצים

---

## 7. שלבי ביצוע

### Phase 1 — עיבוד תמונה (Python)

בנה ובדוק בסדר הזה:

1. `grid_detector.py` — קבל נתיב תמונה, זהה את הגריד עם OpenCV לפי רווחים לבנים אופקיים ואנכיים, חתוך כל פאנל, שמור ל-tmp/panels. הדפס כמה פאנלים זוהו.
2. `bg_remover.py` — קבל נתיב פאנל, החזר PNG עם ערוץ alpha (רקע שקוף).
3. `sticker_maker.py` — קבל PNG שקוף, הוסף stroke לבן של 8 פיקסלים מסביב לדמות, resize ל-512x512 עם שמירת יחס, שמור WebP.
4. `process.py` — מחבר את הכל, מקבל נתיב תמונה כ-argument, מחזיר JSON לstdout עם רשימת נתיבי WebP.

בדיקת Phase 1: הרץ ידנית על התמונה לדוגמה ובדוק שהפלט נראה טוב לפני שממשיכים.

### Phase 2 — בוט WhatsApp (Node.js)

1. `index.js` — אתחל `whatsapp-web.js`, הצג QR בטרמינל, הקשב ל-`message` event.
2. כשמגיעה תמונה: הורד, שמור ל-tmp, הרץ Python כ-child process, פרס JSON מה-stdout.
3. `sender.js` — קבל מערך נתיבים, שלח כל אחד כ-sticker ל-TARGET_NUMBER עם השהייה.
4. שלח הודעת אישור + נקה tmp.

### Phase 3 — גימורים

1. טיפול בשגיאות בכל שלב — אם Python נכשל, לשלוח הודעה "הייתה בעיה בעיבוד התמונה, נסה שנית"
2. אם תמונה לא זוהו בה פאנלים, לשלוח "לא זוהו דמויות בתמונה"
3. log בסיסי לקונסול עם timestamp לכל פעולה

---

## 8. פעולות ראשונות

```bash
# 1. צור תיקיית פרויקט והתקן תלויות Python
mkdir StickerBot && cd StickerBot
pip install opencv-python rembg pillow onnxruntime

# 2. אתחל Node.js והתקן תלויות
npm init -y
npm install whatsapp-web.js qrcode-terminal dotenv

# 3. צור קובץ .env עם המספר הקבוע שלך
echo "TARGET_NUMBER=972XXXXXXXXX@c.us" > .env

# 4. צור תיקיות
mkdir -p tmp/panels tmp/stickers tmp/archive processor bot

# 5. בדוק שהכל עובד — הרץ את processor על תמונה לדוגמה לפני שנוגעים בבוט
python processor/process.py path/to/test_image.jpg
```
