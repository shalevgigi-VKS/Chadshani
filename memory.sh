#!/bin/bash
# memory.sh — מושך הקשר טכני לתחילת סשן

echo "=== 5 קומיטים אחרונים ==="
git log --oneline -5 2>/dev/null || echo "לא נמצא git repo"

echo ""
echo "=== קבצים ששונו לאחרונה ==="
git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "אין שינויים"

echo ""
echo "=== ענף נוכחי ==="
git branch --show-current 2>/dev/null || echo "לא ידוע"

echo ""
echo "=== שגיאות אחרונות (stderr log) ==="
if [ -f ".errors.log" ]; then tail -20 .errors.log; else echo "אין קובץ שגיאות"; fi
