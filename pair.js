import express from "express";
import { makeWASocket, useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import P from "pino";
import fs from "fs";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const number = req.query.number;
    if (!number) return res.status(400).send("❌ Please include your WhatsApp number.");

    const cleanNum = number.replace(/[^0-9]/g, "");
    const sessionId = `LUNA_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    console.log(`📱 Generating pairing code for: ${cleanNum} (Session: ${sessionId})`);

    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);

    const client = makeWASocket({
      printQRInTerminal: false,
      logger: P({ level: "silent" }),
      browser: ["SILENT-LUNA", "Chrome", "10.0"],
      auth: state,
    });

    client.ev.on("creds.update", saveCreds);

    await delay(1500);
    const code = await client.requestPairingCode(cleanNum);

    console.log(`✅ Pairing code for ${cleanNum}: ${code}`);
    res.status(200).send(`🌙 *SILENT-LUNA Pairing Code:* ${code}\n🪄 Session ID: ${sessionId}`);

    client.ev.on("connection.update", ({ connection }) => {
      if (connection === "open") console.log("🟢 SILENT-LUNA Connected!");
      else if (connection === "close") console.log("⚠️ Connection closed.");
    });

  } catch (err) {
    console.error("❌ Error generating pairing code:", err);
    res.status(503).send("Service unavailable — try again in a few seconds.");
  }
});

export default router;
