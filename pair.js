import express from "express";
import P from "pino";
import { makeWASocket, useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";

const router = express.Router();

// Helper: generate unique session IDs
function makeid(num = 6) {
  let result = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < num; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

router.get("/", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.status(400).send("❌ Please include your number");

  const cleanNum = number.replace(/[^0-9]/g, "");
  const sessionId = `LUNA_${makeid()}`;

  console.log(`📱 Generating pairing code for: ${cleanNum} (Session: ${sessionId})`);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);

    const client = makeWASocket({
      printQRInTerminal: false,
      logger: P({ level: "silent" }),
      browser: ["LUNA-BOT", "Safari", "2.3000.1"],
      auth: state,
    });

    client.ev.on("creds.update", saveCreds);

    client.ev.on("connection.update", async (update) => {
      const { connection, qr } = update;

      if (qr) {
        // Send QR code as image
        const qrBuffer = await QRCode.toBuffer(qr);
        res.type("png").send(qrBuffer);
      }

      if (connection === "open") {
        console.log(`🟢 LUNA connected successfully for ${cleanNum}!`);
        await client.sendMessage(client.user.id, { text: "Session is active! 🎉" });
      }
    });

  } catch (err) {
    console.error("❌ Error generating pairing code:", err);
    if (!res.headersSent) res.status(503).send("Server error while generating code");
  }
});

export default router;
