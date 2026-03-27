"use strict";
/**
 * Module 05 — whatsapp_sender
 * Send an array of WebP sticker files to TARGET_NUMBER with configured delay.
 */

const { MessageMedia } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");

const STICKER_DELAY_MS = parseInt(process.env.STICKER_DELAY_MS || "500", 10);
const STICKER_AUTHOR = process.env.STICKER_AUTHOR || "StickerBot";
const STICKER_PACK = process.env.STICKER_PACK || "StickerBot Pack";

/**
 * Send sticker files to a WhatsApp number.
 *
 * @param {import('whatsapp-web.js').Client} client - Authenticated WA client
 * @param {string[]} stickerPaths - Array of absolute paths to WebP files
 * @param {string} targetNumber - Format: 972XXXXXXXXX@c.us
 * @returns {Promise<{total: number, sent: number, failed: number, failedIndexes: number[]}>}
 */
async function sendStickers(client, stickerPaths, targetNumber) {
  if (!stickerPaths || stickerPaths.length === 0) {
    throw new Error("No stickers to send");
  }

  if (!targetNumber || !targetNumber.endsWith("@c.us")) {
    throw new Error(`Invalid target number format: ${targetNumber}`);
  }

  const total = stickerPaths.length;
  let sent = 0;
  let failed = 0;
  const failedIndexes = [];

  for (let i = 0; i < stickerPaths.length; i++) {
    const stickerPath = stickerPaths[i];

    // Validate file exists
    if (!fs.existsSync(stickerPath)) {
      console.error(`[sender] File not found, skipping: ${path.basename(stickerPath)}`);
      failed++;
      failedIndexes.push(i);
      continue;
    }

    try {
      const media = MessageMedia.fromFilePath(stickerPath);
      await client.sendMessage(targetNumber, media, {
        sendMediaAsSticker: true,
        stickerAuthor: STICKER_AUTHOR,
        stickerName: STICKER_PACK,
      });
      console.log(`[sender] Sent sticker ${i + 1}/${total}: ${path.basename(stickerPath)}`);
      sent++;
    } catch (err) {
      console.error(`[sender] Failed to send sticker ${i + 1}: ${err.message}`);
      failed++;
      failedIndexes.push(i);

      if (err.message && err.message.includes("not registered")) {
        console.error(`[sender] TARGET_NUMBER ${targetNumber} is not registered on WhatsApp — aborting`);
        break;
      }
    }

    // Delay between sends (skip delay after last sticker)
    if (i < stickerPaths.length - 1) {
      await _sleep(STICKER_DELAY_MS);
    }
  }

  return { total, sent, failed, failedIndexes };
}

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { sendStickers };
