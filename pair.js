import express from "express";
import P from "pino";
import { makeWASocket, useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import fs from "fs";

const router = express.Router();

function makeid(num = 6) {
  let result = "";
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < num; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

router.get("/", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.status(400).send("❌ Please include your number");

  const cleanNum = number.replace(/[^0-9]/g, "");
  const sessionId = `LUNA_${Math.random().toString(36).substring(2, 8)}`;

  console.log(`📱 Generating session for ${cleanNum} (ID: ${sessionId})`);

  // Send immediate response to avoid H13
  res.sendFile("public/code.html", { root: "." });

  // Background pairing
  const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);
  const client = makeWASocket({
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    browser: ["LUNA-BOT", "Safari", "2.3000.1"],
    auth: state
  });

  client.ev.on("creds.update", saveCreds);

  client.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      const code = makeid();
      const filePath = `./sessions/${sessionId}/code.txt`;
      fs.writeFileSync(filePath, code);
      console.log(`✅ Pairing code for ${cleanNum}: ${code}`);
    }
    if (connection === "open") {
      console.log(`🟢 LUNA connected successfully: ${sessionId}`);
    } else if (connection === "close") {
      console.log("⚠️ Connection closed, retrying...");
    }
  });
});

export default router;
