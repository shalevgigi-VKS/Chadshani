# גיגיז — תכנית פיתוח מלאה ומעודכנת

---

## מה קיים כבר (Phase 1–4 — בנוי)

7 אזורים מסונכרנים בזמן אמת:
- ✅ משימות משותפות
- 🛒 קניות עם כמויות
- 🎟 שוברים וקודי הנחה עם תוקף
- 💰 כסף צפוי / החזרים
- 📋 חשבונות קבועים חוזרים
- 🎯 יעדי חיסכון עם progress bar
- 📄 מסמכים (תמונות + PDF)

ניווט Drawer, כפתור + חכם, היסטוריה מלאה, Local Notifications.
ארכיטקטורה: React Native + Expo + Firebase Spark (חינמי לגמרי).

---

## Phase 5 — סריקת מסמכים חכמה

### מה זה עושה
מצלמים / בוחרים תמונה מהגלריה / מוואצאפ →
Gemini 1.5 Flash מחלץ נתונים →
גיגיז מציג לאישור ושואל מה לעשות עם התמונה.

### זרימה מלאה
```
בחירת מקור:
  📷 מצלמה | 🖼 גלריה | 📱 שיתוף מוואצאפ (Share Extension)
        ↓
Gemini 1.5 Flash רואה תמונה ומחזיר:
{
  type: "חשבון חשמל" | "שובר" | "תעודה" | "חוזה" | "קבלה",
  vendor: "חברת החשמל",
  amount: 340,
  date: "15/03/2026",
  dueDate: "30/03/2026",
  suggestedArea: "bills" | "vouchers" | "documents" | "money",
  code?: "SAVE20",
  extractedText: "טקסט מלא מהמסמך"
}
        ↓
מסך אישור — המשתמש רואה:
  - מה זוהה (סוג + ספק + סכום + תאריך)
  - קטגוריה מוצעת (ניתן לשנות)
  - שלוש אפשרויות לתמונה:
    1. "שמור + כווץ" — שומר נתונים + תמונה מכווצת ב-Storage
    2. "שמור נתונים בלבד" — שומר נתונים, מוחק תמונה
    3. "ביטול"
        ↓
שמירה לאזור המתאים ב-Firestore
+ רשומה בהיסטוריה: "שלו סרק חשבון חשמל ₪340"
```

### קבצים חדשים
```
app/(app)/scan.tsx              — מסך סריקה ראשי
app/(app)/scan-confirm.tsx      — מסך אישור נתונים שחולצו
lib/gemini.ts                   — קריאה ל-Gemini API + פרסור תגובה
lib/imageCompress.ts            — כיווץ תמונה לפני שמירה
```

### lib/gemini.ts — מבנה הקריאה
```typescript
const PROMPT = `
אתה מנתח מסמכים עבריים ואנגליים.
נתח את המסמך בתמונה והחזר JSON בלבד, ללא טקסט נוסף:
{
  "type": "חשבון" | "שובר" | "תעודה" | "חוזה" | "קבלה" | "אחר",
  "vendor": "שם הספק או המוסד",
  "amount": number | null,
  "date": "dd/MM/yyyy" | null,
  "dueDate": "dd/MM/yyyy" | null,
  "code": "קוד שובר אם קיים" | null,
  "suggestedArea": "bills" | "vouchers" | "documents" | "money" | "reminders",
  "title": "כותרת קצרה לשמירה",
  "extractedText": "הטקסט המלא שזוהה במסמך"
}
`;

// קריאה חינמית — Gemini 1.5 Flash
// מפתח: Google AI Studio → aistudio.google.com → Get API Key (חינמי)
// 1,500 קריאות ביום — מעולם לא ייגמר לשניים
```

### lib/imageCompress.ts
```typescript
// expo-image-manipulator — מובנה ב-Expo, אפס עלות
// תמונה ~3MB → ~150KB
// איכות: 0.6 — קריאה מושלמת, משקל קטן
import * as ImageManipulator from 'expo-image-manipulator';

export async function compressForStorage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
```

### עלויות Phase 5
| רכיב | עלות |
|---|---|
| Gemini 1.5 Flash API | חינם (1,500/יום) |
| Firebase Storage | חינם (5GB כולל) |
| expo-image-manipulator | חינם |
| expo-camera | חינם |
| **סה"כ** | **אפס** |

---

## Phase 6 — דשבורד + לוח שנה

### מה יש בדשבורד
- פאנל "דחוף קרוב" — כל הפריטים מכל האזורים ב-7 הימים הקרובים
- סיכום כספי חודשי: לשלם vs לקבל
- התקדמות יעדי חיסכון
- גרף הוצאות 6 חודשים אחרונים
- זמני כניסת ויציאת שבת + פרשת השבוע לפי מיקום

### לוח שנה חודשי
- ניווט חופשי בין חודשים
- כל יום מסומן לפי מה יש בו:
  - 🔴 תשלום / תוקף שובר / פג תוקף
  - 🟡 כסף צפוי להגיע
  - 🟣 יעד / אבן דרך
  - 🕯 כניסת שבת
- לחיצה על יום → רשימת הפריטים של אותו יום

### זמני שבת — Hebcal API
```
GET https://www.hebcal.com/shabbat?cfg=json&geonameid=293397&m=50
חינמי לגמרי, ללא מפתח API
מחזיר: כניסה, יציאה, פרשת השבוע
cache ב-AsyncStorage — קריאה אחת בשבוע בלבד
```

### קבצים חדשים
```
app/(app)/dashboard.tsx         — דשבורד ראשי
app/(app)/calendar.tsx          — לוח שנה חודשי
lib/shabbat.ts                  — Hebcal API + cache
lib/dashboardData.ts            — איחוד נתונים מכל ה-collections
components/MonthlyCalendar.tsx  — רכיב לוח שנה
components/UrgentPanel.tsx      — פאנל פריטים דחופים
components/SpendingChart.tsx    — גרף הוצאות
components/ShabbatCard.tsx      — כרטיס שבת עם כניסה/יציאה/פרשה
```

---

## Phase 7 — תורים וחופשות (אזור 8)

### מה זה
אזור חדש בגיגיז — תאריך + מיקום + מי מגיע + תזכורת.

### שינויים נדרשים
```
constants/types.ts    — הוסף AppointmentItem
constants/areas.ts    — הוסף 'appointments' לרשימה
app/(app)/areas/appointments/index.tsx  — מסך חדש
```

### טיפוס
```typescript
export interface AppointmentItem extends BaseEntry {
  area: 'appointments';
  title: string;
  location?: string;
  date: Timestamp;
  attendees: UserId[];   // שלו / לי / שניהם
  notes?: string;
  reminderDaysBefore: number;
}
```

---

## Phase 8 — ווידג'טים לאייפון

### מה בחרת: ווידג'ט לכל אזור בנפרד

### 7 ווידג'טים (אחד לכל אזור)
כל ווידג'ט מציג את הפריט הדחוף ביותר באזור שלו:

| ווידג'ט | מה מציג |
|---|---|
| שוברים | שובר שפג תוקפו הכי קרוב + הקוד שלו |
| חשבונות | חשבון הבא לתשלום + סכום + כמה ימים |
| כסף צפוי | הסכום הבא שמגיע + מתי |
| משימות | כמה משימות פתוחות |
| קניות | כמה פריטים ברשימה |
| יעדים | היעד הקרוב ביותר + אחוז התקדמות |
| מסמכים | מסמך שתוקפו פג בקרוב |

### טכנולוגיה
**expo-widget-kit** (Expo SDK 52+) — ווידג'טים SwiftUI מתוך Expo.
דורש EAS Build — לא עובד ב-Expo Go.

### מנגנון נתונים
```
Firestore → App Group shared container → Widget קורא מקומית
(ווידג'ט לא ניגש ל-Firestore ישירות)
```

### קובץ חדש
```
lib/widgetSync.ts    — מעדכן App Group בכל פתיחת אפליקציה
```

---

## Phase 9 — מעקב הוצאות מהמייל

עתידי — Gmail OAuth + Cloud Function.
דורש Blaze Plan אם רוצים real-time.
אלטרנטיבה: polling ידני בפתיחת האפליקציה (חינמי).

---

## סיכום סדר בנייה

| Phase | מה | עלות | תלויות |
|---|---|---|---|
| 5 | סריקת מסמכים + Gemini | חינם | Gemini API key (1 דקה) |
| 6 | דשבורד + לוח שנה + שבת | חינם | Phase 1–4 |
| 7 | תורים וחופשות | חינם | אין |
| 8 | ווידג'טים | חינם | EAS Build |
| 9 | מעקב מייל | חינם* | Gmail OAuth |

*חינמי עם polling, עולה כסף רק עם real-time push

---

## הגדרת Gemini API — פעם אחת, 2 דקות

1. כנס ל-aistudio.google.com
2. לחץ "Get API Key"
3. צור מפתח חדש — חינמי לגמרי
4. הוסף ל-.env.local:
   EXPO_PUBLIC_GEMINI_API_KEY=your_key_here

זהו. 1,500 סריקות ביום. לשניכם לא ייגמר לעולם.
