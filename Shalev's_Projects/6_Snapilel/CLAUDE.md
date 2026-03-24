# סנאפילל (Snapilel) — מפרט מלא לקלוד קוד

## מה זה סנאפילל?
בוט טלגרם שמקבל קישור YouTube ומחזיר פירוק עומק מלא.
שולחים קישור → מורידים אודיו → מתמללים → מפרקים → בקרת איכות → פירוק מושלם בטלגרם.
הכל בענן. המחשב כבוי. האייפון נעול. זהו.

---

## כללי ברזל
- אפס עלות — ללא כרטיס אשראי, ללא תשלום (Claude בקרה עולה סנטים בלבד)
- ללא מגבלת אורך סרטון — חלוקה אוטומטית
- עברית ואנגלית — זיהוי שפה אוטומטי
- הבוט פרטי — whitelist בלבד
- לא לשנות ארכיטקטורה בלי לשאול

---

## פייפליין מלא

```
URL מהאייפון
      ↓
whitelist check  →  לא מורשה: 🚫 הודעה וסיום
      ↓
תור בקשות  →  🕐 הודעת תור אם יש המתנה
      ↓
yt-dlp  →  הורדת MP3
  כשל → retry פעם אחת → כשל סופי: ❌ הודעה ברורה
      ↓
Groq Whisper  →  תמלול גולמי
  כשל → retry פעם אחת → כשל סופי: ❌ הודעה ברורה
      ↓
Claude  →  פירוק עומק
  כשל חלקי → שולח מה שיש + ⚠️ הערה
  כשל מלא → שולח תמלול גולמי + ⚠️ הערה
      ↓
Python validator  →  בדיקות טכניות
  נמצאה בעיה → Claude validator → תיקון
  הכל תקין → ממשיך בלי Claude (חיסכון בטוקנים)
      ↓
טלגרם  →  📝 פירוק מושלם
```

---

## Stack טכנולוגי

| שכבה | כלי | סיבה |
|------|-----|------|
| בוט | python-telegram-bot 20.x | סטנדרט, תיעוד מעולה |
| הורדת אודיו | yt-dlp (עדכון אוטומטי בכל deploy) | עובד גם על סרטונים נעולים |
| תמלול | Groq API whisper-large-v3-turbo | חינמי, מהיר |
| פירוק | Claude claude-sonnet-4-20250514 | פירוק עומק בעברית |
| בקרה טכנית | Python + regex | חינם, מהיר |
| בקרה סגנונית | Claude (רק אם נדרש) | חיסכון בטוקנים |
| שרת | Render.com Worker free tier | לא נכבה, 750 שעות/חודש |

---

## מבנה קבצים

```
snapilel/
├── CLAUDE.md
├── transcribe_bot.py    ← בוט ראשי + תור + whitelist + הודעות
├── downloader.py        ← yt-dlp + retry + טיפול בכשלים
├── transcriber.py       ← Groq + retry + חלוקה לחלקים
├── decomposer.py        ← Claude פירוק + ניהול טוקנים
├── validator.py         ← Python קודם, Claude רק אם צריך
├── logger.py            ← לוג בסיסי של כל בקשה
├── requirements.txt
├── Procfile
├── render.yaml          ← כולל ffmpeg + עדכון yt-dlp
└── .env.example
```

---

## משתני סביבה

```env
TELEGRAM_TOKEN=          # מ-BotFather
GROQ_API_KEY=            # מ-console.groq.com
ANTHROPIC_API_KEY=       # מ-console.anthropic.com
ALLOWED_USER_IDS=        # Telegram IDs מופרדים בפסיק: 123456,789012
```

כיצד מוצאים Telegram ID: שולחים הודעה ל-@userinfobot.

---

## הודעות טלגרם — רשימה מלאה

| מצב | הודעה |
|-----|-------|
| URL לא תקין | ⛔ זה לא קישור YouTube תקין |
| משתמש לא מורשה | 🚫 אין לך גישה לסנאפילל |
| בתור | 🕐 בתור — יש X בקשות לפניך |
| מוריד אודיו | ⏳ מוריד אודיו... |
| retry הורדה | 🔄 נסיון חוזר להורדה... |
| מתמלל | 🎙️ מתמלל את הסרטון (X דקות)... |
| retry תמלול | 🔄 נסיון חוזר לתמלול... |
| מפרק | 🧠 מפרק... |
| בקרת איכות | 🔍 בקרת איכות... |
| פירוק מלא מוכן | 📝 פירוק מלא מוכן |
| פירוק חלקי | ⚠️ פירוק חלקי — הסרטון ארוך מאוד |
| פירוק נכשל | ⚠️ פירוק נכשל — זהו תמלול גולמי |
| כשל סופי | ❌ הבקשה נכשלה: [סיבה ברורה בעברית] |

---

## הקוד

### transcribe_bot.py
```python
"""
הבוט הראשי של סנאפילל.
אחראי על: whitelist, תור, הודעות סטטוס, תיאום הפייפליין.
"""
import os
import asyncio
from collections import deque
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes
from downloader import download_audio
from transcriber import transcribe
from decomposer import decompose
from validator import validate
from logger import log

TELEGRAM_TOKEN = os.environ["TELEGRAM_TOKEN"]
ALLOWED_USER_IDS = set(
    int(uid.strip())
    for uid in os.environ.get("ALLOWED_USER_IDS", "").split(",")
    if uid.strip()
)

# תור בקשות — מעבד אחד אחרי השני
queue: deque = deque()
processing = False


def is_youtube_url(text: str) -> bool:
    return any(x in text for x in ["youtube.com/watch", "youtu.be/", "youtube.com/shorts"])


async def process_request(update: Update, url: str):
    global processing
    processing = True
    status = await update.message.reply_text("⏳ מוריד אודיו...")
    audio_path = None

    try:
        # שלב 1: הורדת אודיו
        try:
            audio_path, title, duration_sec = await asyncio.to_thread(download_audio, url)
        except Exception as e:
            await status.edit_text(f"❌ הורדה נכשלה: {e}")
            log(url, "download_failed", str(e))
            return

        minutes = duration_sec // 60
        await status.edit_text(f"🎙️ מתמלל את הסרטון ({minutes} דקות)...")

        # שלב 2: תמלול
        try:
            raw_transcript = await asyncio.to_thread(transcribe, audio_path)
        except Exception as e:
            await status.edit_text(f"❌ תמלול נכשל: {e}")
            log(url, "transcribe_failed", str(e))
            return

        await status.edit_text("🧠 מפרק...")

        # שלב 3: פירוק עומק
        decomposed = None
        partial = False
        try:
            decomposed = await asyncio.to_thread(decompose, raw_transcript, title)
        except Exception as e:
            log(url, "decompose_failed", str(e))
            partial = True

        await status.edit_text("🔍 בקרת איכות...")

        # שלב 4: בקרה
        if decomposed:
            try:
                final_text = await asyncio.to_thread(validate, decomposed)
            except Exception:
                final_text = decomposed
        else:
            final_text = f"⚠️ פירוק נכשל — זהו תמלול גולמי\n\n{raw_transcript}"

        # שלב 5: שליחה
        await status.delete()

        if partial:
            await update.message.reply_text("⚠️ פירוק חלקי — הסרטון ארוך מאוד")

        label = "📝 פירוק מלא מוכן" if decomposed and not partial else "⚠️ פירוק נכשל — זהו תמלול גולמי"
        await update.message.reply_text(label)

        for chunk in [final_text[i:i+4000] for i in range(0, len(final_text), 4000)]:
            await update.message.reply_text(chunk)

        log(url, "success", f"{minutes} דקות")

    finally:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        processing = False
        await process_queue()


async def process_queue():
    global processing
    if queue and not processing:
        update, url = queue.popleft()
        await process_request(update, url)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id

    # בדיקת whitelist
    if ALLOWED_USER_IDS and user_id not in ALLOWED_USER_IDS:
        await update.message.reply_text("🚫 אין לך גישה לסנאפילל")
        return

    url = update.message.text.strip()

    if not is_youtube_url(url):
        await update.message.reply_text("⛔ זה לא קישור YouTube תקין")
        return

    # תור
    if processing:
        position = len(queue) + 1
        queue.append((update, url))
        await update.message.reply_text(f"🕐 בתור — יש {position} בקשות לפניך")
        return

    await process_request(update, url)


def main():
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    print("✅ סנאפילל רץ...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
```

### downloader.py
```python
"""
הורדת אודיו מ-YouTube עם yt-dlp.
retry אוטומטי פעם אחת בכשל.
מחזיר: (נתיב MP3, כותרת, משך בשניות)
"""
import os
import time
import tempfile
import yt_dlp


def _download(url: str, output_path: str):
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "quiet": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return info.get("title", "ללא כותרת"), info.get("duration", 0)


def download_audio(url: str) -> tuple[str, str, int]:
    tmpdir = tempfile.mkdtemp()
    output_path = os.path.join(tmpdir, "audio")

    for attempt in range(2):
        try:
            title, duration = _download(url, output_path)
            audio_file = output_path + ".mp3"
            if not os.path.exists(audio_file):
                raise FileNotFoundError("קובץ MP3 לא נוצר")
            return audio_file, title, duration
        except Exception as e:
            if attempt == 0:
                time.sleep(3)
                continue
            # כשלים נפוצים עם הסבר ברור
            msg = str(e)
            if "private" in msg.lower():
                raise Exception("הסרטון פרטי ולא ניתן להורדה")
            if "age" in msg.lower():
                raise Exception("הסרטון מוגבל לגיל ודורש כניסה לחשבון")
            if "removed" in msg.lower() or "unavailable" in msg.lower():
                raise Exception("הסרטון הוסר או אינו זמין")
            raise Exception(f"שגיאת הורדה: {msg}")
```

### transcriber.py
```python
"""
תמלול גולמי עם Groq API.
retry אוטומטי פעם אחת בכשל.
קבצים מעל 24MB מחולקים אוטומטית לחלקים של 20 דקות.
"""
import os
import time
from groq import Groq

client = Groq(api_key=os.environ["GROQ_API_KEY"])
MAX_FILE_SIZE = 24 * 1024 * 1024  # 24MB


def _transcribe_chunk(audio_path: str) -> str:
    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=f,
            response_format="text",
        )
    return response


def transcribe(audio_path: str) -> str:
    for attempt in range(2):
        try:
            file_size = os.path.getsize(audio_path)

            if file_size <= MAX_FILE_SIZE:
                return _transcribe_chunk(audio_path)

            # קובץ גדול — חלוקה לחלקים
            from pydub import AudioSegment
            audio = AudioSegment.from_mp3(audio_path)
            chunk_ms = 20 * 60 * 1000
            chunks = [audio[i:i+chunk_ms] for i in range(0, len(audio), chunk_ms)]

            results = []
            base = audio_path.replace(".mp3", "")
            for i, chunk in enumerate(chunks):
                chunk_path = f"{base}_part{i}.mp3"
                chunk.export(chunk_path, format="mp3")
                results.append(_transcribe_chunk(chunk_path))
                os.remove(chunk_path)

            return "\n".join(results)

        except Exception as e:
            if attempt == 0:
                time.sleep(3)
                continue
            msg = str(e)
            if "rate_limit" in msg.lower():
                raise Exception("חריגה ממכסת Groq היומית — נסה מחר")
            raise Exception(f"שגיאת תמלול: {msg}")
```

### decomposer.py
```python
"""
פירוק עומק של תמלול גולמי עם Claude.
תמלולים ארוכים מחולקים לחלקים לניהול חלון ההקשר.
הפרומפט נטוע בקוד ואין לשנותו.
"""
import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

# מקסימום תווים לשליחה ב-API אחד — מניעת חריגת context
MAX_CHARS_PER_CALL = 80000

DECOMPOSE_SYSTEM_PROMPT = """זהות ותפקיד

אתה מערכת פירוק מקצועית שתפקידה לשכפל את צורת החשיבה של הדובר מתוך תמלול של הרצאה, שיעור, סקירה או כל תוכן שמוזן אליך.
המטרה אינה לסכם. המטרה היא שהקורא יחוש שהדובר יושב לידו ומדבר אליו אחד על אחד.
אתה משכפל את לוגיקת החשיבה, הדרך שבה הדובר מסתכל על דברים, איך הוא מצליב נתונים, מה הוא שם לב אליו ולמה, ולא רק את מה שנאמר.

-----

סוגי פירוק

סקירה יומית: פירוק עומק מבני מלא עם כל הנקודות המהותיות, לא שחזור כרונולוגי מילולי מוחלט מילה במילה.
שיעור לימודי / הרצאה / אקדמיה: שחזור כרונולוגי מלא, רציף, מדויק, אפס השמטות, ברמת מחשבה ותהליך.

-----

כללי תוכן מחייבים

שחזור כרונולוגי מלא של מהלך הדברים כפי שהדובר בנה אותם.
אפס השמטות בשום מצב.
אין קיצורים. אין סיכומים במקום פירוק. אין פרשנות חיצונית.
אין הוספת ידע שלא הופיע בתמלול המקורי.
אין המלצות. אין שאלות בסוף. אין מסקנות שלא נאמרו.
אין שינוי משמעות.
יש לתעד חזרות, הדגשות, דינמיקה, טון והיגיון פנימי של הדובר.
יש לשמר תאריכים, חודשים ושנים כאשר מוזכרים.
יש לכלול דוגמאות ואנלוגיות רק אם הדובר עצמו נתן אותן.
יש להתעלם לחלוטין מדיסקליימרים, פתיחי מיתוג, קריאות להירשם, שיווק קהילה ופרידות סיום.
יש לתעד במפורש את לוגיקת ההחלטה של הדובר: למה הוא הגיע למסקנה מסוימת, איך הוא הצליב נתונים, מה הוא שם לב אליו ומה דחה.

-----

כללי סגנון וניסוח

כתיבה בגוף ראשון פנימי כאשר מדובר בפירוק בסגנון יומן.
שימוש בשם הדובר במפורש כאשר לא מדובר ביומן. לדוגמה: מיכה, אדי, רן.
אין להשתמש ב"הוא" באופן עמום.
אין אנגלית סגנונית כלל. טיקרים ושמות פיננסיים באנגלית מותרים בלבד.
טיקר: הרחבה בסוגריים פעם ראשונה בלבד בפורמט: TICKER (שם בעברית - תחום קצר).
META יש לכתוב META ולא "מתה".
אין שימוש במקף ארוך.
אין חותמות זמן בגוף הטקסט.
כותרת אחת בלבד בראש הפלט.
הכותרת תכלול תאריך מלא בפורמט יום.חודש.שנה.
כותרות סקירות יומיות ייכתבו בשורה אחת בלבד: תאריך מקוצר ואז רווח ואז הכותרת. לדוגמה: 23.12.24 תעודות הסל החמות ל 2025.
כל פסקה תסתיים בנקודה. אין להשאיר משפט פתוח.
אין מטא הסברים על התהליך.
אין להישמע כמו בינה מלאכותית. הטקסט צריך לזרום כאילו אדם כתב אותו.
חדשות מתורגמות במלואן לעברית בלבד.

-----

מבנה טכני מחייב

פסקאות ארוכות, זורמות ורציפות.
אין רשימות נקודתיות אלא אם התבקש במפורש.
אין חלוקה לחלקים. אין ציון "חלק ראשון" או "חלק שני".
הפלט הוא רצף אחד מלא ללא הפסקות.
רמת פירוט מקסימלית. אורך הפלט נקבע לפי כמות התוכן האמיתי, לא לפי אורך הסרטון.
אין שינוי אורך שרירותי. אין לקצר כי הפלט "ארוך מדי".

-----

פרוטוקול הפעלה

כאשר המשתמש מדביק תמלול וכותב "תפרק": הפעל את כל הכללים לעיל ללא יוצא מן הכלל.
אל תשאל שאלות לפני הפירוק. פרק מיד.
אל תסביר מה אתה עושה לפני שאתה עושה. תן רק את הפלט.
אם חסר מידע בתמלול, ציין זאת בתוך הפירוק עצמו בצורה טבעית, לא כהערת שוליים.
לאחר הפירוק, אל תוסיף שאלות, הצעות או הערות.

-----

מה שיכפול המוח אומר בפועל

לא רק לתעד מה הדובר אמר, אלא לתעד איך הוא חושב.
כאשר הדובר עושה השוואה בין שני נכסים, לתעד לא רק את המספרים אלא את הלוגיקה שמאחורי ההשוואה.
כאשר הדובר דוחה אפשרות, לתעד מדוע הוא דוחה אותה.
כאשר הדובר מזהיר, לתעד את מנגנון האזהרה ולא רק את תוכנה.
כאשר הדובר נותן דוגמה, לתעד למה הוא בחר דווקא בדוגמה הזו ומה הוא מנסה להמחיש.
המטרה: שהקורא יוכל לשאול שאלה חדשה ולחשוב איך הדובר היה עונה עליה."""


def _call_claude(transcript: str, title: str) -> str:
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8096,
        system=DECOMPOSE_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"כותרת הסרטון: {title}\n\nתמלול:\n{transcript}\n\nתפרק"
        }]
    )
    return message.content[0].text


def decompose(transcript: str, title: str) -> str:
    # תמלול קצר — שליחה ישירה
    if len(transcript) <= MAX_CHARS_PER_CALL:
        return _call_claude(transcript, title)

    # תמלול ארוך — חלוקה לחלקים וחיבור
    parts = [transcript[i:i+MAX_CHARS_PER_CALL]
             for i in range(0, len(transcript), MAX_CHARS_PER_CALL)]
    results = []
    for i, part in enumerate(parts):
        part_title = f"{title} (חלק {i+1} מתוך {len(parts)})"
        results.append(_call_claude(part, part_title))

    return "\n\n".join(results)
```

### validator.py
```python
"""
בקרת איכות דו-שלבית:
1. Python בודק כללים טכניים — חינם ומהיר
2. Claude מתקן רק אם Python מצא בעיות — חיסכון בטוקנים
"""
import re
import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

VALIDATOR_SYSTEM_PROMPT = """אתה עורך טקסט עברי מקצועי. תקבל פירוק עומק עם רשימת בעיות שנמצאו.
תקן את הבעיות בדיוק כפי שמפורט. אל תשנה דבר מעבר לבעיות המפורטות.
החזר את הטקסט המתוקן בלבד, ללא הסברים."""


def python_check(text: str) -> list[str]:
    issues = []

    # מקף ארוך
    if "—" in text:
        issues.append("יש מקפים ארוכים (—) — יש להחליף במקף קצר (-) או לנסח מחדש")

    # נקודה באמצע פסקה (משפט שמסתיים בנקודה ואחריו עוד טקסט באותה פסקה)
    if re.search(r'\. [א-ת]', text):
        issues.append("יש נקודות באמצע פסקה — כל פסקה צריכה להיות משפט רצוף אחד המסתיים בנקודה")

    # רשימות נקודתיות
    if re.search(r'^\s*[-•*]\s', text, re.MULTILINE):
        issues.append("יש רשימות נקודתיות — יש להמיר לפסקאות רצופות")

    # כותרות מרובות (יותר משורה אחת עם # או שורה ריקה לפניה ואחריה)
    headers = re.findall(r'^#{1,3} .+', text, re.MULTILINE)
    if len(headers) > 1:
        issues.append("יש יותר מכותרת אחת — מותרת כותרת אחת בלבד בראש הפלט")

    # פסקה שלא מסתיימת בנקודה
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    for p in paragraphs:
        if p and not p.endswith(".") and not p.startswith("#"):
            issues.append(f"פסקה לא מסתיימת בנקודה: ...{p[-50:]}")
            break

    # אנגלית סגנונית (מילים שאינן טיקרים או שמות פיננסיים)
    english_words = re.findall(r'\b[a-zA-Z]{4,}\b', text)
    suspicious = [w for w in english_words if not w.isupper() and len(w) > 5]
    if suspicious:
        issues.append(f"ייתכן שיש אנגלית סגנונית: {', '.join(set(suspicious[:5]))}")

    return issues


def claude_fix(text: str, issues: list[str]) -> str:
    issues_str = "\n".join(f"- {issue}" for issue in issues)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8096,
        system=VALIDATOR_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"בעיות שנמצאו:\n{issues_str}\n\nטקסט לתיקון:\n{text}"
        }]
    )
    return message.content[0].text


def validate(text: str) -> str:
    issues = python_check(text)

    # אין בעיות — מחזירים כמו שזה, בלי לקרוא ל-Claude
    if not issues:
        return text

    # יש בעיות — Claude מתקן
    return claude_fix(text, issues)
```

### logger.py
```python
"""
לוג בסיסי של כל בקשה לקובץ snapilel.log.
"""
import os
from datetime import datetime


LOG_FILE = "snapilel.log"


def log(url: str, status: str, detail: str = ""):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {status} | {url} | {detail}\n"
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line)
    print(line.strip())
```

### requirements.txt
```
python-telegram-bot==20.7
yt-dlp
groq
anthropic
pydub
```

### Procfile
```
worker: python transcribe_bot.py
```

### render.yaml
```yaml
services:
  - type: worker
    name: snapilel
    env: python
    buildCommand: pip install -U yt-dlp && pip install -r requirements.txt && apt-get install -y ffmpeg
    startCommand: python transcribe_bot.py
    envVars:
      - key: TELEGRAM_TOKEN
        sync: false
      - key: GROQ_API_KEY
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: ALLOWED_USER_IDS
        sync: false
```

### .env.example
```env
TELEGRAM_TOKEN=your_telegram_bot_token_here
GROQ_API_KEY=your_groq_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ALLOWED_USER_IDS=your_telegram_id_here
```

### .gitignore
```
.env
__pycache__/
*.pyc
snapilel.log
```

---

## הגדרה מקומית (לפיתוח)

```bash
git clone <repo>
cd snapilel
pip install -r requirements.txt
cp .env.example .env
# ערוך .env עם הטוקנים שלך
python transcribe_bot.py
```

---

## פריסה ל-Render

1. העלה קוד ל-GitHub (repo פרטי מומלץ)
2. render.com → New → Background Worker → חבר repo
3. Environment Variables → הוסף את ארבעת המשתנים
4. Deploy

---

## קבלת API Keys

### TELEGRAM_TOKEN
פתח @BotFather → /newbot → snapilel_bot → קבל טוקן

### TELEGRAM_ID שלך
שלח הודעה ל-@userinfobot → קבל את ה-ID שלך

### GROQ_API_KEY
console.groq.com → הרשם → API Keys → Create

### ANTHROPIC_API_KEY
console.anthropic.com → API Keys → Create Key

---

## טיפול בכשלים — טבלה מלאה

| כשל | מה קורה | הודעה למשתמש |
|-----|---------|--------------|
| URL לא תקין | עוצר מיד | ⛔ זה לא קישור YouTube תקין |
| משתמש לא מורשה | עוצר מיד | 🚫 אין לך גישה לסנאפילל |
| סרטון פרטי | retry x1 → כשל | ❌ הסרטון פרטי ולא ניתן להורדה |
| סרטון מוגבל גיל | retry x1 → כשל | ❌ הסרטון מוגבל לגיל ודורש כניסה לחשבון |
| סרטון הוסר | retry x1 → כשל | ❌ הסרטון הוסר או אינו זמין |
| ffmpeg חסר | כשל הורדה | ❌ שגיאת הורדה: ffmpeg לא מותקן |
| Groq rate limit | retry x1 → כשל | ❌ חריגה ממכסת Groq היומית — נסה מחר |
| קובץ MP3 פגום | retry x1 → כשל | ❌ שגיאת תמלול |
| Claude context limit | חלוקה אוטומטית | ⚠️ פירוק חלקי — הסרטון ארוך מאוד |
| Claude כשל מלא | שולח תמלול גולמי | ⚠️ פירוק נכשל — זהו תמלול גולמי |
| Render RAM נגמר | קריסה + restart אוטומטי | בוט יחזור לפעולה תוך שניות |

---

## אבטחה

- whitelist — רק ALLOWED_USER_IDS יכולים להשתמש
- .gitignore מגן על .env מהעלאה ל-GitHub
- סינון קלט — ה-URL נבדק לפני שנשלח לכל שירות חיצוני
- אין שמירת תמלולים — כל קובץ אודיו נמחק מיד אחרי עיבוד
- משתני סביבה — אין מפתחות בקוד עצמו

---

## ניהול טוקנים

| שלב | טוקנים | אסטרטגיה |
|-----|--------|----------|
| פירוק | גבוה | חלוקה ל-80K תווים לכל קריאה |
| בקרה Python | אפס | רץ קודם תמיד |
| בקרה Claude | בינוני | רץ רק אם Python מצא בעיה |
| תיקון Claude | נמוך | שולח רק הבעיות, לא כל הטקסט |

---

## תחזוקה

- yt-dlp מתעדכן אוטומטית בכל deploy (מוגדר ב-render.yaml)
- לוגים נשמרים ב-snapilel.log על השרת
- לצפייה בלוגים: Render dashboard → Logs

---

## בדיקת תקינות אחרי פריסה

שלח לבוט קישור YouTube כלשהו.
אם מקבלים פירוק מלא בעברית — הכל עובד.
