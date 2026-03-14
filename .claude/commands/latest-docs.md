לפני כל שינוי קוד — בדוק תיעוד עדכני. הפעל 3 sub-agents במקביל:

**הקלט:** $ARGUMENTS (שם כלי/ספרייה)

**Agent 1 — תיעוד רשמי:**
WebSearch: "$ARGUMENTS official documentation latest"
→ מצא: גרסה נוכחית, breaking changes, deprecations

**Agent 2 — Changelog:**
WebSearch: "$ARGUMENTS changelog release notes 2025 2026"
→ מצא: שינויים מהגרסה האחרונה

**Agent 3 — בעיות ידועות:**
WebSearch: "$ARGUMENTS github issues breaking changes known bugs"
→ מצא: בעיות פתוחות רלוונטיות

**איחוד:**
```
כלי: [שם]
גרסה נוכחית: [X.Y.Z]
Breaking changes: [אם קיימים]
Deprecations: [אם קיימים]
בעיות ידועות: [אם קיימות]
בטוח להמשיך: [כן/לא + סיבה]
```

כתב הסיכום ל-`memory/active-context.md` לפני שממשיכים לקוד.
