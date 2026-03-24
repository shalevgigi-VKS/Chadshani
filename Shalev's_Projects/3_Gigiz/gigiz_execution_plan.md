# מסמך ביצוע — גיגיז

## סקירה

אפליקציית ניהול כספי ותזכורות משפחתית לשלו ולי בלבד. מנהלת שוברים, כספים צפויים,
תזכורות ותשלומים קבועים חוזרים — ממוינים לפי תאריך קרוב, עם push notifications
שבוע ויום לפני כל תאריך, היסטוריה מלאה עם שם המשתמש שביצע כל פעולה, וארכיון
אוטומטי לפריטים שטופלו או פג תוקפם.

לפני תחילת הבנייה — עבור על כל המסמך, זהה נקודות לשיפור, ייעל ארכיטקטורה,
וודא שאין כפילויות או חוסרים. רק אחרי אישור פנימי של התוכנית — התחל לבנות.

---

## מבנה קבצים מלא

```
gigiz/
├── app/
│   ├── index.tsx                     # מסך PIN — כניסה ובחירת שלו/לי
│   └── (main)/
│       ├── _layout.tsx               # layout עם ClockHeader + 4 טאבים
│       ├── vouchers.tsx              # שוברים וקודי הנחה
│       ├── money.tsx                 # כספים צפויים (קרן סיוע, החזרים)
│       ├── bills.tsx                 # תשלומים קבועים חוזרים
│       ├── reminders.tsx             # תזכורות כלליות
│       ├── add.tsx                   # הוספת פריט — כל הסוגים
│       ├── item/[id].tsx             # עריכה / טיפול / מחיקה
│       └── history.tsx               # היסטוריה מלאה + פילטר משתמש
│
├── components/
│   ├── ClockHeader.tsx               # שעה ותאריך חיים בראש כל מסך
│   ├── ItemCard.tsx                  # כרטיסיית פריט — סטטוס, תאריך, סוג
│   ├── TypeBadge.tsx                 # תגית צבעונית: שובר/כסף/חשבון/תזכורת
│   ├── UrgencyIndicator.tsx          # היום / מחר / שבוע / רגיל
│   ├── RecurringBadge.tsx            # תגית "חוזר" עם תאריך הבא
│   └── HistoryEntry.tsx              # שורת היסטוריה: שם + פעולה + זמן
│
├── lib/
│   ├── firebase.ts                   # אתחול Firebase — Firestore + Auth + FCM
│   ├── auth.ts                       # לוגיקת PIN + זיהוי שלו/לי + שמירה מקומית
│   ├── items.ts                      # CRUD כל הפריטים — חד-פעמיים וחוזרים
│   ├── recurring.ts                  # לוגיקת תשלומים חוזרים + חישוב תאריך הבא
│   ├── history.ts                    # כתיבה וקריאה של כל פעולות ההיסטוריה
│   └── notifications.ts              # רישום push token + אחסון ב-Firestore
│
├── constants/
│   ├── types.ts                      # Item, RecurringItem, HistoryEntry, ItemType
│   └── users.ts                      # הגדרת שני המשתמשים: שלו / לי
│
└── functions/                        # Firebase Cloud Functions
    └── src/
        ├── index.ts                  # נקודת כניסה — exports לכל ה-functions
        ├── dailyReminder.ts          # scheduler יומי 08:00 — בדיקה ושליחת push
        └── archiveExpired.ts         # scheduler יומי 00:01 — ארכיון פריטים שפגו
```

---

## טכנולוגיות

| טכנולוגיה | גרסה | תפקיד |
|---|---|---|
| React Native | 0.74 | אפליקציה נייטיב iOS + אנדרואיד |
| Expo SDK | 51 | פיתוח מהיר, builds, OTA updates |
| Expo Router | 3.x | ניווט קבצי |
| Firebase Firestore | 10.x | בסיס נתונים בזמן אמת, סנכרון אוטומטי |
| Firebase Auth | 10.x | כניסה אנונימית + Custom Claims לזיהוי משתמש |
| Firebase Cloud Functions | 5.x | לוגיקת צד שרת + התראות מתוזמנות |
| Firebase Cloud Messaging | 10.x | push notifications לשני הטלפונים |
| Expo Notifications | 0.28 | ניהול push tokens + הצגת התראות |
| AsyncStorage | 1.x | שמירת בחירת משתמש מקומית בין פתיחות |
| date-fns | 3.x | חישובי תאריכים, מיון, זמן יחסי |

---

## סכמת נתונים — Firestore

### collection: `items`
```typescript
{
  id: string,
  type: 'voucher' | 'money' | 'bill' | 'reminder',
  title: string,
  description?: string,
  amount?: number,               // לכסף ותשלומים
  amountPaid?: number,           // לתשלומים — מה שולם בפועל
  code?: string,                 // לשוברים — הקוד עצמו
  dueDate: Timestamp,            // תאריך תפוגה / תשלום / תזכורת
  isRecurring: boolean,
  recurringDayOfMonth?: number,  // לתשלומים קבועים — איזה יום בחודש
  status: 'active' | 'handled' | 'expired',
  createdBy: 'shalo' | 'lee',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  handledBy?: 'shalo' | 'lee',
  handledAt?: Timestamp,
}
```

### collection: `history`
```typescript
{
  id: string,
  itemId: string,
  itemTitle: string,
  action: 'created' | 'edited' | 'deleted' | 'handled' | 'archived',
  performedBy: 'shalo' | 'lee',
  timestamp: Timestamp,
  changes?: object,   // מה השתנה בעריכה
}
```

### collection: `pushTokens`
```typescript
{
  userId: 'shalo' | 'lee',
  token: string,
  platform: 'ios' | 'android',
  updatedAt: Timestamp,
}
```

---

## זרימה מרכזית

```
פתיחת אפליקציה
    ↓
מסך PIN — קוד קבוע משותף
    ↓
בחירת שם: שלו / לי — נשמר ב-AsyncStorage
    ↓
מסך ראשי — 4 טאבים, כל טאב ממוין לפי dueDate קרוב ביותר
    ↓
הוספת פריט → נשמר ב-Firestore → מסונכרן לטלפון השני מיד
    ↓
Cloud Function dailyReminder — רץ כל יום 08:00:
    → פריט שdueDate שלו עוד 7 ימים → push לשני הטלפונים
    → פריט שdueDate שלו מחר → push נוסף לשני הטלפונים
    ↓
Cloud Function archiveExpired — רץ כל יום 00:01:
    → פריט לא חוזר שפג תוקפו → status = 'expired', נכתב ל-history
    → פריט חוזר שפג תוקפו → dueDate מתעדכן לחודש הבא + נרשם ב-history
    ↓
סימון "טופל" ע"י משתמש:
    → status = 'handled', handledBy = שם המשתמש, handledAt = עכשיו
    → נכתב ל-history עם שם + זמן
    → נשאר גלוי בטאב עם תגית "טופל"
    ↓
מחיקת פריט:
    → נכתב ל-history לפני המחיקה
    → מוחק מ-Firestore
```

---

## משתני סביבה

```env
# .env.local — לא לשמור ב-git, לא להעלות לשום מקום
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=        # project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=         # שם הפרויקט ב-Firebase
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=     # project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
APP_PIN=                                  # הקוד הסודי המשותף — לא ב-git
```

הסיסמה נשמרת רק ב-AsyncStorage של הטלפון. לא עוברת לשרת בשום שלב.

---

## אבטחה — חייב לממש

```
Firestore Security Rules:
  - קריאה וכתיבה מותרת רק עם Firebase Auth token תקין
  - אין גישה ציבורית לאף collection
  - pushTokens — כתיבה מותרת רק לדוקומנט של userId תואם ל-auth.uid

נקודות נוספות:
  - PIN מאוחסן רק ב-AsyncStorage, לא נשלח לשום שרת
  - .env.local כלול ב-.gitignore לפני הקומיט הראשון
  - Cloud Functions עם הרשאות מינימליות בלבד
```

---

## Phases לביצוע

### Phase 1 — MVP
- מסך PIN + בחירת שלו/לי
- 4 טאבים עם ItemCard ו-ClockHeader
- הוספת פריט — כל הסוגים כולל חוזר
- מחיקה ועריכה
- מיון לפי תאריך קרוב
- סנכרון Firestore בזמן אמת בין שני הטלפונים

**קריטריון סיום: פריט שמתווסף בטלפון אחד מופיע מיד בשני**

### Phase 2 — היסטוריה + ארכיון
- מסך היסטוריה עם פילטר לפי משתמש
- כתיבה אוטומטית ל-history בכל פעולה
- סימון "טופל" עם שם + זמן + סכום ששולם בפועל
- archiveExpired Cloud Function
- לוגיקת תשלומים חוזרים — חישוב taaריך הבא אוטומטי

**קריטריון סיום: ניתן לעקוב מי עשה מה ומתי**

### Phase 3 — התראות
- רישום push tokens ב-Firestore
- dailyReminder Cloud Function
- push notifications לשבוע + יום לפני
- UrgencyIndicator על ItemCard

**קריטריון סיום: התראה אמיתית מתקבלת על שני הטלפונים**

### Phase 4 — עיצוב וחוויה
- Visual design מלוטש — לא ברירת מחדל Expo
- RecurringBadge + TypeBadge צבעוני לפי סוג
- אנימציה למעבר לארכיון
- אייקון + splash screen עם שם גיגיז
- Expo EAS Build להפצה

---

## פעולות ראשונות

```bash
# 1 — צור פרויקט Expo
npx create-expo-app gigiz --template blank-typescript
cd gigiz

# 2 — התקן תלויות
npx expo install expo-router expo-notifications @react-native-async-storage/async-storage
npm install firebase date-fns

# 3 — צור את מבנה הקבצים המלא לפי העץ למעלה
#     התחל מ-constants/types.ts ו-lib/firebase.ts לפני כל דבר אחר

# 4 — הוסף .env.local ל-.gitignore לפני הקומיט הראשון

# 5 — אתחל Firebase Cloud Functions
mkdir functions && cd functions
npm init -y && npm install firebase-admin firebase-functions
cd ..

# 6 — הרץ
npx expo start
```

### נקודה ידנית אחת לפני הרצה
היכנס ל-Firebase Console — console.firebase.google.com
צור פרויקט חדש בשם `gigiz`
הפעל: Firestore Database + Authentication + Cloud Messaging
העתק את ה-config ל-.env.local
זה לוקח כ-5 דקות ואי אפשר לאוטומט אותו.
