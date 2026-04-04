"""
update_links_doc.py — מעדכן את "קישורים מקלוד קוד" ב-Gmail Drafts + ntfy.

איך עובד:
  - מחפש ב-Gmail את הדרפט עם הכותרת "📎 קישורים מקלוד קוד"
  - מוחק אותו ויוצר חדש עם הרשימה המעודכנת
  - שולח התראת ntfy לאייפון

הפעלה ידנית:
  claude -p "הרץ את update_links_doc.py עם פרויקט חדש: שם=X url=Y"

DRAFT_ID נוכחי: r-3156031332120144279
"""

GDOC_ID      = "1tIY-tdeBaQFQzJhjXZZkCA3_2ZF3-zauwvi_UIO3fYk"
GDOC_URL     = f"https://docs.google.com/document/d/{GDOC_ID}/edit"
GMAIL_DRAFT  = "r-3156031332120144279"
NTFY_TOPIC   = "CloudeCode"

# ── פרויקטים ידועים ───────────────────────────────────────────────────────────
KNOWN_PROJECTS = [
    ("חדשני",      "דסק מודיעין שוק יומי — AI, קריפטו, מאקרו",  "https://shalevgigi-vks.github.io/Chadshani/", "#0050d4", "LIVE",   "#dcfce7", "#16a34a"),
    ("אבולוציה",   "Evolution Schematic — ויזואליזציית קריירה",   "https://evolution-schematic.vercel.app",        "#7c3aed", "LIVE",   "#dcfce7", "#16a34a"),
    ("LinkToText", "URL ל-Text Extractor",                         "https://linktotext.vercel.app",                 "#0891b2", "LIVE",   "#dcfce7", "#16a34a"),
    ("LCL TCS",    "TCS App — ממתין הפעלת Firebase Auth",          "https://lcl-4b863.web.app",                     "#f59e0b", "PAUSED", "#fef9c3", "#ca8a04"),
]

# NOTE: קובץ זה מנוהל על ידי project-documenter agent.
# כשמתווסף פרויקט — הוסף שורה ל-KNOWN_PROJECTS ואז הפעל מ-Claude Code session.
