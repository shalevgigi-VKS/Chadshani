# HANDOFF — קסם הידיעה (Project 9)
Last updated: 2026-04-04
Status: 🔨 בפיתוח — v3 בנוי, טרם נבדק בדפדפן

---

## מה הפרויקט

אפליקציית ווב לייצור סרטוני חינוך לילדים (גיל 4–7) ב-YouTube.
המשתמש מקליד נושא בעברית → Claude Haiku כותב תסריט בחרוזי AABB → האפליקציה מייצרת סרטון אנימציה מצויר אוטומטית ומוריד WebM.

---

## קובץ ראשי

```
Shalev's_Projects/9_Kesem/extracted/project-package/web-interface/index.html
```

קובץ יחיד, ~950 שורות. פותח ישירות ב-Chrome — ללא שרת, ללא build.

---

## ארכיטקטורה

| רכיב | פירוט |
|------|-------|
| **Script Gen** | Claude API (claude-haiku-4-5-20251001) — prompt → JSON עם 5 סצינות AABB |
| **Canvas** | 1280×720, 16:9, drawDanny() + drawChico() — דמויות מצוירות בקוד |
| **Music** | Web Audio API — oscillators, C major pentatonic, נקלט בהקלטה |
| **Recording** | MediaRecorder (canvas stream + audio dest) → WebM |
| **TTS** | speechSynthesis עברי — preview בלבד, לא נקלט |

---

## Flow המשתמש

```
Screen 1: הכנס API key + נושא חופשי בעברית
    ↓ קריאה ל-Claude Haiku
Screen 2: תצוגת תסריט (5 סצינות)
    ↓ לחיצה "צור סרטון"
Screen 3: ייצור אוטומטי (progress bar)
    ↓ סיום
Screen 4: preview + הורדת WebM
```

---

## דמויות

- **דני** — ילד גיל 6, חולצה כחולה. `drawDanny(x, y, scale, mood, bounce)`
- **צ'יקו** — דוב חום. `drawChico(x, y, scale, mood, bounce)`
- moods: `'happy'` | `'curious'` | `'excited'`

---

## מה הושלם

- [x] Screen 1: קלט API key + נושא
- [x] קריאת Claude Haiku API → JSON תסריט
- [x] Screen 2: תצוגת תסריט
- [x] drawDanny() — דמות מלאה עם ביטויי פנים
- [x] drawChico() — דמות מלאה עם ביטויי פנים
- [x] 3 סוגי רקע: חדר, כוכבים, צבעוני
- [x] Web Audio מוזיקה (oscillators, נקלטת)
- [x] generateVideo() → MediaRecorder → WebM 1280×720
- [x] TTS preview mode (Hebrew)
- [x] קונפטי ב-Act 3
- [x] Progress bar + watermark

---

## מה נשאר

- [ ] **בדיקה בפועל ב-Chrome** — פתח index.html, הכנס API key, בדוק flow מלא
- [ ] בדוק שהWebM נפתח ב-VLC/YouTube ו-1280×720
- [ ] אם TTS לא עובד על Windows — הוסף הנחיית הורדת קול עברי

---

## החלטות שהתקבלו

| החלטה | סיבה |
|-------|------|
| Claude Haiku (לא Sonnet) | עלות — תסריט קצר, לא דורש reasoning עמוק |
| TTS לא נקלט | speechSynthesis עוקף Web Audio pipeline — מגבלת דפדפן |
| קובץ יחיד (לא build) | פשטות — פותח ישירות, אפס תלויות |
| MediaRecorder + Web Audio | היחיד שעובד offline לכידת canvas+audio |

---

## כיצד להמשיך בסשן חדש

1. פתח `web-interface/index.html` ב-Chrome
2. בדוק flow מלא עם API key אמיתי
3. אם יש באגים — קרא את הקובץ ותקן נקודתית (אל תכתוב מחדש)
4. לאחר בדיקה מוצלחת — שנה סטטוס ל-✅ מושלם

---

## קבצי עזר בפרויקט

```
docs/01_character_system.md   — עיצוב דני + צ'יקו
docs/02_episode_template.md   — תבנית פרק
docs/04_topic_bank.md         — רשימת נושאים לפי Tier
docs/06_visual_style_guide.md — סגנון ויזואלי
```
