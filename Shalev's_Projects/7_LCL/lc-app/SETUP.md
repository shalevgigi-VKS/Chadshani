# הוראות הקמה — מערכת ניהול פרוטוקולים (LCL)

## שלב 1: יצירת Firebase Project

1. עבור ל-https://console.firebase.google.com
2. "Create a project" → שם לבחירתך
3. הפעל את השירותים הבאים:
   - **Authentication** → Sign-in method → Email/Password → Enable
   - **Firestore Database** → Create database → Start in production mode
   - **Storage** → Get started

4. Project Settings → Your apps → "Web app" (</>):
   - רשום אפליקציית web
   - **העתק** את ה-firebaseConfig שמוצג

## שלב 2: הגדרת קבצי Config

ב-`src/firebase.ts` — החלף את כל ה-`REPLACE_WITH_...` בערכים האמיתיים מ-Firebase.

ב-`.firebaserc` — החלף את `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` ב-Project ID שלך.

## שלב 3: יצירת משתמש Admin ראשון

בFirebase Console → Authentication → Add user:
- אימייל + סיסמה (לפי בחירתך)

לאחר מכן, ב-Firestore → לחץ "Start collection" → שם: `users`:
```
Document ID: [ה-UID של המשתמש שיצרת]
Fields:
  fullName: "שמך"
  role: "admin"
  isActiveShift: false
  lastActive: null
```

## שלב 4: התקנת Firebase CLI

```bash
npm install -g firebase-tools
firebase login
cd lc-app
firebase init
```

בתהליך firebase init:
- בחר: Firestore, Hosting, Storage
- Use existing project → בחר את הפרויקט שלך
- Firestore rules: `firestore.rules` (כבר קיים)
- Public directory: `dist`
- SPA: Yes

## שלב 5: Build ו-Deploy

```bash
npm run build
firebase deploy
```

תקבל URL בסגנון: `https://YOUR-PROJECT.web.app`

## שלב 6: התקנה על iPhone

1. פתח את ה-URL ב-Safari
2. לחץ על כפתור Share (הריבוע עם החץ)
3. "Add to Home Screen"
4. האפליקציה תותקן כ-PWA עם אייקון מלא

---

## מבנה הרשאות

| תפקיד | יכולות |
|--------|---------|
| `admin` | ניהול משתמשים, יצירת/עריכת פרוטוקולים, צפייה בהכל |
| `manager` | צפייה ב-live dashboard, מעקב אחרי קצינים ו-instances |
| `user` | פתיחת/סגירת משמרת, ביצוע פרוטוקולים בשטח |

## הוספת משתמשים נוספים

1. Firebase Console → Authentication → Add user
2. Firestore → users → הוסף document עם UID כ-ID
3. הגדר `role: "manager"` או `role: "user"`
