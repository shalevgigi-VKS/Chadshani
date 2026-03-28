# פרויקט 0 — התראות iPhone (ntfy)

## מטרה
שליחת התראות push לאייפון על אירועי Claude Code ופרויקטים.

## טופיקים
| טופיק | שימוש |
|-------|--------|
| CLA0511 | אירועי Claude Code (סיום, ממתין, מכסה) |
| CHA0511 | עדכוני Chadshani (GitHub Actions) |

## כלל שליחה — Hebrew חייב Python
```python
import json, urllib.request
data = json.dumps({'topic':'CLA0511','title':'...','message':'...'}).encode('utf-8')
req = urllib.request.Request('https://ntfy.sh', data=data,
      headers={'Content-Type': 'application/json; charset=utf-8'})
urllib.request.urlopen(req)
```

## Hook files
- ~/.claude/hooks/notification/ntfy-notify.sh
- ~/.claude/hooks/stop/ntfy-stop.sh

## כותרות לפי פרויקט
- 1_chadshani → "חדשני"
- 2_RemoteAccess → "שליטה מרחוק"
- אחר → "Claude"

## עדיפויות
- סיים → priority 3
- ממתין לאישור → priority 4
- מכסה נגמרה → priority 5 urgent
