"use strict";
/**
 * Module 06 — bot_entrypoint
 * Initialize WhatsApp bot, listen for image messages, run pipeline, send stickers.
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const http = require("http");
const { exec } = require("child_process");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { sendStickers } = require("./sender");

// ── Environment validation ─────────────────────────────────────────────────
const REQUIRED_ENV = ["TARGET_NUMBER", "STICKER_DELAY_MS", "STICKER_AUTHOR", "STICKER_PACK"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[bot] Missing required env variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

const TARGET_NUMBER = process.env.TARGET_NUMBER;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB

// ── Directory setup ────────────────────────────────────────────────────────
const BASE_DIR = path.join(__dirname, "..");
const TMP_DIR = path.join(BASE_DIR, "tmp");
const PANELS_DIR = path.join(TMP_DIR, "panels");
const STICKERS_DIR = path.join(TMP_DIR, "stickers");
const ARCHIVE_DIR = path.join(TMP_DIR, "archive");
const SESSION_DIR = path.join(__dirname, "session");

for (const dir of [TMP_DIR, PANELS_DIR, STICKERS_DIR, ARCHIVE_DIR, SESSION_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

// ── WhatsApp client ────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: SESSION_DIR }),
  puppeteer: { args: ["--no-sandbox", "--disable-setuid-sandbox"] },
});

// ── QR HTTP server ─────────────────────────────────────────────────────────
let _qrDataUrl = null;
const QR_PORT = 3000;

const qrServer = http.createServer(async (req, res) => {
  if (_qrDataUrl) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="10">
<title>WhatsApp QR</title>
<style>body{background:#111;display:flex;flex-direction:column;align-items:center;
justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#fff;}
img{width:420px;height:420px;border:12px solid #fff;border-radius:16px;}
p{font-size:1.2rem;margin-top:20px;opacity:.7;}</style></head>
<body><img src="${_qrDataUrl}"><p>סרוק עם הטאבלט → WhatsApp → מכשירים מקושרים</p>
<p style="font-size:.9rem">מתרענן אוטומטית כל 10 שניות</p></body></html>`);
  } else {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="3">
<title>ממתין...</title><style>body{background:#111;color:#fff;display:flex;align-items:center;
justify-content:center;height:100vh;font-family:sans-serif;font-size:1.5rem;}</style></head>
<body>ממתין לקוד QR...</body></html>`);
  }
});

qrServer.listen(QR_PORT, () => {
  log(`QR server ready → http://localhost:${QR_PORT}`);
});

// ── Event: QR code ─────────────────────────────────────────────────────────
client.on("qr", async (qr) => {
  log("Scan QR code to connect WhatsApp");
  qrcode.generate(qr, { small: true });
  try {
    _qrDataUrl = await QRCode.toDataURL(qr, { width: 420, margin: 2 });
    log(`QR ready in browser → http://localhost:${QR_PORT}`);
    exec(`start http://localhost:${QR_PORT}`);
  } catch (err) {
    log(`QR browser gen failed: ${err.message}`);
  }
});

// ── Event: Ready ───────────────────────────────────────────────────────────
client.on("ready", async () => {
  log("WhatsApp bot ready — listening for images");
  try {
    await client.sendMessage(TARGET_NUMBER, "הבוט מוכן! 🎯\nשלח לי תמונת גריד ואמיר אותה למדבקות ווצאפ.");
    log(`Greeting sent to ${TARGET_NUMBER}`);
  } catch (err) {
    log(`Could not send greeting: ${err.message}`);
  }
});

// ── Event: Message ─────────────────────────────────────────────────────────
client.on("message", async (message) => {
  // Ignore status broadcasts and self-messages
  if (message.from === "status@broadcast") return;
  if (message.fromMe) return;

  // Ignore non-image messages silently
  if (message.type !== "image") return;

  log(`Received image from ${message.from}`);

  let inputPath = null;

  try {
    // Download media
    const media = await message.downloadMedia();
    if (!media) {
      log("WARNING: Could not download media — skipping");
      return;
    }

    // Check file size
    const buffer = Buffer.from(media.data, "base64");
    if (buffer.length > MAX_IMAGE_BYTES) {
      log(`Image too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB) — rejecting`);
      await message.reply("התמונה גדולה מדי, נסה תמונה קטנה יותר");
      return;
    }

    // Save to tmp
    const timestamp = Date.now();
    const ext = media.mimetype.includes("png") ? "png" : "jpg";
    inputPath = path.join(TMP_DIR, `input_${timestamp}.${ext}`);
    fs.writeFileSync(inputPath, buffer);
    log(`Saved input image: ${path.basename(inputPath)}`);

    // Run Python processor
    const stickerPaths = await runProcessor(inputPath);
    log(`Processor returned ${stickerPaths.length} sticker(s)`);

    // Send stickers back to the same chat
    const result = await sendStickers(client, stickerPaths, message.from);
    log(`Sent ${result.sent}/${result.total} sticker(s)`);

    // Confirm in same conversation
    await message.reply(`נשלחו ${result.sent} מדבקות בהצלחה ✓`);

    // Cleanup
    await cleanup(inputPath, stickerPaths);

  } catch (err) {
    console.error(`[bot] ${ts()} Unhandled error in message handler:`, err.message);
    try {
      await message.reply("הייתה בעיה בעיבוד התמונה, נסה שנית");
    } catch (_) {}
    // Preserve tmp files on failure for debugging
  }
});

// ── Event: Disconnected ────────────────────────────────────────────────────
client.on("disconnected", async (reason) => {
  log(`WhatsApp disconnected — reason: ${reason}`);
  log("Attempting reconnect...");
  try {
    await client.initialize();
  } catch (err) {
    log(`Reconnect failed: ${err.message} — stopping`);
  }
});

// ── Python processor ───────────────────────────────────────────────────────
function runProcessor(imagePath) {
  return new Promise((resolve, reject) => {
    const processorScript = path.join(BASE_DIR, "processor", "process.py");
    const proc = spawn("python", [processorScript, imagePath], {
      cwd: BASE_DIR,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => {
      const line = data.toString().trimEnd();
      console.error(`[processor] ${line}`);
      stderr += line + "\n";
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Processor exited with code ${code}: ${stderr.slice(-200)}`));
        return;
      }

      try {
        const paths = JSON.parse(stdout.trim());
        if (!Array.isArray(paths) || paths.length === 0) {
          reject(new Error("Processor returned empty sticker list"));
          return;
        }
        resolve(paths);
      } catch (e) {
        reject(new Error(`Failed to parse processor JSON: ${e.message}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn processor: ${err.message}`));
    });
  });
}

// ── Cleanup ────────────────────────────────────────────────────────────────
async function cleanup(inputPath, stickerPaths) {
  try {
    // Delete panel files
    for (const f of fs.readdirSync(PANELS_DIR)) {
      try { fs.unlinkSync(path.join(PANELS_DIR, f)); } catch (_) {}
    }

    // Delete sticker files
    for (const f of fs.readdirSync(STICKERS_DIR)) {
      try { fs.unlinkSync(path.join(STICKERS_DIR, f)); } catch (_) {}
    }

    // Archive original input image
    if (inputPath && fs.existsSync(inputPath)) {
      const archivePath = path.join(ARCHIVE_DIR, path.basename(inputPath));
      fs.renameSync(inputPath, archivePath);
    }

    log("Cleanup complete");
  } catch (err) {
    console.warn(`[bot] ${ts()} Cleanup warning: ${err.message}`);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function ts() {
  return new Date().toISOString();
}

function log(msg) {
  console.log(`[bot] ${ts()} ${msg}`);
}

// ── Start ──────────────────────────────────────────────────────────────────
log("Starting WhatsApp bot...");
client.initialize();
