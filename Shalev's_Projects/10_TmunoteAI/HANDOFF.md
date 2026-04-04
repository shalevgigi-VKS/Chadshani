# פרויקט 10 — תמונות AI
**Last Updated:** 2026-04-04 | **Status:** 🔨 בפיתוח

---

## מה הפרויקט
אפליקציית יצירת תמונות AI מקומית (Text-to-Image + Image-to-Image), ללא API key.
מריצה Stable Diffusion מקומית — הכל פרטי, חינמי, עובד אופליין לאחר הורדה ראשונה (~4 GB).

**שני מצבי הפעלה:**
- 🌐 **אתר מקומי** (מומלץ) — Flask + HTML מתקדם, נפתח בדפדפן
- 🖥️ **אפליקציית Windows** — Python CustomTkinter, חלון רגיל

## קבצים ראשיים

| קובץ | תפקיד |
|------|--------|
| `server.py` | Flask web server + Stable Diffusion API |
| `templates/index.html` | ממשק אתר מקומי (HTML/CSS/JS) |
| `app.py` | אפליקציית Windows (CustomTkinter) |
| `setup.py` | הכנה ראשונה — התקנה + הורדת מודל |

## הפעלה

### פעם ראשונה (חובה)
```
python setup.py
# או לחיצה כפולה על: run_setup.bat
```
מוריד ~4 GB, בודק תמונת test, מדווח שהכל תקין.

### אתר מקומי
```
python server.py
# או: run_web.bat
# → נפתח אוטומטית בכתובת http://localhost:5000
```

### אפליקציית Windows
```
python app.py
# או: run.bat
```

## ארכיטקטורה

| רכיב | טכנולוגיה | פרטים |
|------|-----------|--------|
| Backend | Python Flask | Routes: /, /api/generate, /api/img2img, /api/history, /output/ |
| AI Model | Stable Diffusion v1.5 | runwayml/stable-diffusion-v1-5, diffusers |
| GUI (Web) | HTML/CSS/JS | Single-page, dark theme, RTL Hebrew |
| GUI (Desktop) | CustomTkinter | Dark mode, threading |
| Device | CUDA / CPU | אוטומטי — GPU אם יש NVIDIA |
| Auto-save | output/ folder | PNG + TXT log לכל תמונה |

## פיצ'רים — אתר מקומי

| פיצ'ר | תיאור |
|--------|--------|
| טקסט לתמונה | Prompt + Negative Prompt + יחס + צעדים |
| תמונה לתמונה | העלאת סקיצה → AI ממיר לתמונה מקצועית |
| שמירה אוטומטית | output/ + יומן פרומפט TXT |
| הורדה | כפתור ⬇️ מוריד PNG לדיסק |
| היסטוריה | גלריה של תמונות קיימות, לחיצה לטעינה |
| יחס תמונה | 9:16 / 1:1 / 16:9 |
| כרטיסי פרומפט | 6 קטגוריות: פיננסים / עיצוב אישי / פוטו-ריאליסטי |
| עריכת פרומפט | כל כרטיס ניתן לפתיחה ועריכה לפני שימוש |

## כרטיסי הפרומפט המובנים

**פיננסים:** מרכז פיקוד עתידני | שור ודוב — עימות אגדי
**עיצוב אישי:** גלגל הרגשות | דף צביעה לילדים
**פוטו-ריאליסטי:** משאית בנגב | עיר עתידנית בשקיעה

## מה הושלם
- [x] server.py — Flask backend עם generate + img2img + history
- [x] templates/index.html — UI מלא עם כל הפיצ'רים
- [x] app.py — Windows desktop app
- [x] setup.py — התקנה + הורדת מודל + בדיקת sanity
- [x] run_web.bat, run.bat, run_setup.bat
- [x] 6 כרטיסי פרומפט עם expand/edit
- [x] Auto-save + היסטוריה
- [x] img2img pipeline
- [x] Thread safety (gen_lock)

## מה נשאר
- [ ] הרצה ראשונה ואימות (נדרש מחשב עם Python)
- [ ] אופציונלי: בחירת מודל (v1.5 / v2.1)
- [ ] אופציונלי: upscaling (ESRGAN)
- [ ] אופציונלי: אריזת EXE (PyInstaller)

## קבצים רלוונטיים
- [server.py](server.py) — Backend Flask
- [templates/index.html](templates/index.html) — Web UI
- [app.py](app.py) — Desktop app
- [setup.py](setup.py) — First-time setup
- [output/](output/) — תמונות שמורות
