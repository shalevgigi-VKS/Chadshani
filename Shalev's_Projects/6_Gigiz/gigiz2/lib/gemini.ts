/**
 * Gemini 1.5 Flash — document scanning
 * Free tier: 1,500 requests/day — more than enough for 2 users
 * Setup: aistudio.google.com → Get API Key (free, 1 minute)
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface ScanResult {
  type: 'חשבון' | 'שובר' | 'תעודה' | 'חוזה' | 'קבלה' | 'אחר';
  vendor: string | null;
  amount: number | null;
  date: string | null;        // dd/MM/yyyy
  dueDate: string | null;     // dd/MM/yyyy
  code: string | null;        // voucher code if found
  suggestedArea: 'bills' | 'vouchers' | 'documents' | 'money' | 'reminders';
  title: string;
  extractedText: string;
}

const PROMPT = `אתה מנתח מסמכים עבריים ואנגליים.
נתח את המסמך בתמונה והחזר JSON בלבד, ללא טקסט נוסף, ללא markdown:
{
  "type": "חשבון" | "שובר" | "תעודה" | "חוזה" | "קבלה" | "אחר",
  "vendor": "שם הספק או המוסד או null",
  "amount": number או null,
  "date": "dd/MM/yyyy" או null,
  "dueDate": "dd/MM/yyyy תאריך לתשלום אם קיים" או null,
  "code": "קוד שובר אם קיים" או null,
  "suggestedArea": "bills" | "vouchers" | "documents" | "money" | "reminders",
  "title": "כותרת קצרה ותמציתית לשמירה",
  "extractedText": "הטקסט המלא שזוהה במסמך"
}`;

export async function scanDocument(imageUri: string): Promise<ScanResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is missing in .env.local');

  // Convert image URI to base64
  const response = await fetch(imageUri);
  const blob     = await response.blob();
  const base64   = await blobToBase64(blob);
  const mimeType = 'image/jpeg';

  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ],
    }],
  };

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip markdown fences if present
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as ScanResult;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
