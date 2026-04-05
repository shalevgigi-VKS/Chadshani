/**
 * Chadshani Telegram Bot — Cloudflare Worker
 * Receives Telegram webhook → triggers GitHub Actions workflow_dispatch
 * Env vars (set via wrangler secret put):
 *   TELEGRAM_BOT_TOKEN, GITHUB_PAT, GITHUB_REPO, WORKFLOW_FILE
 */

const TRIGGERS = ['עדכן', 'תעדכן', 'update', 'עדכון'];

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Chadshani Bot OK', { status: 200 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('OK');
    }

    const text   = body?.message?.text || '';
    const chatId = body?.message?.chat?.id;

    if (!chatId) return new Response('OK');

    const triggered = TRIGGERS.some(t => text.includes(t));
    if (!triggered) return new Response('OK');

    // Trigger GitHub Actions workflow_dispatch
    const ghResp = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${env.WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Chadshani-Worker/1.0',
        },
        body: JSON.stringify({ ref: 'master' }),
      }
    );

    const replyText = ghResp.ok
      ? 'מעדכן... ⏳\nתקבל התראה כשיסתיים.'
      : `⚠️ שגיאה (${ghResp.status}) — בדוק GitHub Actions`;

    await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: replyText }),
      }
    );

    return new Response('OK');
  }
};
