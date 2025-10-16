import express from "express";
import P from "pino";
import { makeWASocket, useMultiFileAuthState, delay } from "@whiskeysockets/baileys";

const router = express.Router();

// Utility: make a random session ID
function makeSessionId() {
  return `LUNA_${Math.random().toString(36).substring(2, 8)}`;
}

// GET /code?number=...
router.get("/", async (req, res) => {
  try {
    const rawNumber = req.query.number;
    if (!rawNumber) return res.status(400).send("❌ Please include your number");

    // Ensure E.164 format (+countrycode)
    const number = `+${rawNumber.replace(/[^0-9]/g, "")}`;
    const sessionId = makeSessionId();

    console.log(`📱 Generating pairing code for: ${number} (Session: ${sessionId})`);

    // Auth state for this session
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);

    const client = makeWASocket({
      printQRInTerminal: false,
      logger: P({ level: "silent" }),
      browser: ["LUNA-BOT", "Safari", "2.3000.1"],
      auth: state,
    });

    client.ev.on("creds.update", saveCreds);

    // Short wait before pairing
    await delay(2000);

    // Request pairing code from WhatsApp
    const code = await client.requestPairingCode(number);
    console.log(`✅ Pairing code for ${number}: ${code}`);

    res.status(200).send(`🔐 Your LUNA Pairing Code: ${code}`);

    client.ev.on("connection.update", ({ connection, lastDisconnect }) => {
      if (connection === "open") console.log("🟢 LUNA connected successfully!");
      else if (connection === "close") {
        console.log("⚠️ Connection closed, retrying...");
      }
    });
  } catch (err) {
    console.error("❌ Error generating pairing code:", err);
    res.status(503).send("Server error while generating code");
  }
});

export default router;
