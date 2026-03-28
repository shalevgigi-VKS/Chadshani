# גיגיז — הוראות לקלוד קוד

## מה זה
אפליקציה משפחתית לשלו ולי. מסונכרנת בזמן אמת. iOS + אנדרואיד. חינמי לחלוטין.

---

## לפני npm install — שלוש הגדרות חד-פעמיות

1. Firebase (5 דקות) — console.firebase.google.com
   פרויקט חדש: gigiz → הפעל Firestore + Auth (Anonymous) + Storage
   Project Settings → העתק config ל-.env.local

2. Gemini API (דקה) — aistudio.google.com → Get API Key → חינמי
   EXPO_PUBLIC_GEMINI_API_KEY=... ב-.env.local

3. PIN — הוסף APP_PIN=הקוד_הסודי ב-.env.local

---

## התקנה
npm install && npx expo start

---

## מבנה

app/index.tsx                  מסך PIN + בחירת שלו/לי
app/(app)/_layout.tsx          Drawer navigation
app/(app)/home.tsx             דף בית: tiles + FAB + ClockHeader
app/(app)/scan.tsx             סריקת מסמך
app/(app)/scan-confirm.tsx     אישור נתונים שנסרקו
app/(app)/add/index.tsx        הוספה אוניברסלית
app/(app)/item/[id].tsx        עריכה / מחיקה
app/(app)/history.tsx          היסטוריה
app/(app)/areas/tasks          משימות
app/(app)/areas/shopping       קניות
app/(app)/areas/vouchers       שוברים
app/(app)/areas/money          כסף צפוי
app/(app)/areas/bills          חשבונות קבועים
app/(app)/areas/goals          יעדי חיסכון
app/(app)/areas/documents      מסמכים

lib/firebase.ts        אתחול
lib/auth.ts            PIN + משתמש
lib/db.ts              CRUD גנרי + history
lib/startup.ts         רץ בפתיחה: ארכיון + חידוש + notifications
lib/notifications.ts   Local Notifications בלבד (ללא FCM)
lib/gemini.ts          סריקה עם Gemini 1.5 Flash
lib/imageCompress.ts   כיווץ תמונות
lib/recurring.ts       חישוב תאריך הבא
lib/storage.ts         העלאת קבצים

constants/types.ts     כל הטיפוסים
constants/areas.ts     הגדרת 7 האזורים
constants/users.ts     שלו ולי

---

## חיבור startup.ts

ב-app/index.tsx, לאחר אימות המשתמש:
import { runStartupTasks } from '../lib/startup';
useEffect(() => { if (user) runStartupTasks(); }, [user]);

---

## ללא Cloud Functions — הכל חינמי

אין תיקיית functions. אין Blaze Plan.
startup.ts מחליף הכל: רץ בכל פתיחת אפליקציה.

---

## קריטריון סיום Phase 1
פריט שמוסיפים בטלפון אחד מופיע מיד בשני.
