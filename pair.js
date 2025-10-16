import express from "express";
import fs from "fs";
import { makeWASocket, useMultiFileAuthState, delay, Browsers } from "@whiskeysockets/baileys";
import P from "pino";

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure sessions folder exists
const SESSIONS_DIR = "./sessions";
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  console.log("📁 Created sessions folder");
}

app.get("/", (req, res) => {
  res.send("💫 LUNA is alive and ready to pair!");
});

app.get("/code", async (req, res) => {
  try {
    const number = req.query.number;
    if (!number) return res.status(400).send("❌ Please include your number");

    const cleanNum = number.replace(/[^0-9]/g, "");
    const sessionId = `LUNA_${Math.random().toString(36).substring(2, 8)}`;

    console.log(`📱 Generating pairing code for: ${cleanNum} (Session: ${sessionId})`);

    // Create session folder if somehow missing
    const sessionPath = `${SESSIONS_DIR}/${sessionId}`;
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const client = makeWASocket({
      printQRInTerminal: false,
      logger: P({ level: "silent" }),
      browser: ["LUNA-BOT", "Safari", "2.3000.1"],
      version: [2, 3000, 1],
      auth: state,
    });

    client.ev.on("creds.update", saveCreds);

    // Short wait before pairing
    await delay(2000);

    // Request pairing code
    const code = await client.requestPairingCode(cleanNum);
    console.log(`✅ Pairing code for ${cleanNum}: ${code}`);

    // Send pairing code to browser
    res.status(200).send({ code, sessionId });

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

app.listen(PORT, () => console.log(`🚀 LUNA Pair Server running on port ${PORT}`));
