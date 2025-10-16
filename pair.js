import express from "express";
import { makeWASocket, useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import P from "pino";
import QRCode from "qrcode";

const router = express.Router();

// Utility: make random pairing code
function makeCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

router.get("/", async (req, res) => {
  try {
    const number = req.query.number;
    if (!number) return res.status(400).send("❌ Please include your number");

    const cleanNum = number.replace(/[^0-9]/g, "");
    const sessionId = `LUNA_${Math.random().toString(36).substring(2, 8)}`;
    const pairingCode = makeCode();

    console.log(`📱 Generating pairing code for: ${cleanNum} (Session: ${sessionId})`);

    // Create Baileys client
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);
    const client = makeWASocket({
      printQRInTerminal: false,
      logger: P({ level: "silent" }),
      browser: ["LUNA-BOT", "Safari", "2.3000.1"],
      auth: state,
    });

    client.ev.on("creds.update", saveCreds);

    // Send pairing code on web
    res.send(`
      <h2>🔐 Your LUNA Pairing Code: ${pairingCode}</h2>
      <button onclick="navigator.clipboard.writeText('${pairingCode}')">Copy Code</button>
    `);

    // After 2 seconds, send sessionId to the user via WhatsApp
    client.ev.on("connection.update", async ({ connection }) => {
      if (connection === "open") {
        await delay(2000);
        await client.sendMessage(cleanNum + "@s.whatsapp.net", { text: `💫 Your LUNA session ID: ${sessionId}` });
        console.log(`📩 Session ID sent to ${cleanNum}`);
        client.ws.close();
      }
    });

  } catch (err) {
    console.error("❌ Error generating pairing code:", err);
    if (!res.headersSent) res.status(503).send("Server error while generating code");
  }
});

export default router;
