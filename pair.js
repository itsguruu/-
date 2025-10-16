import express from "express";
import { makeWASocket, useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import P from "pino";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("💫 LUNA is alive and ready to pair!");
});

app.get("/code", async (req, res) => {
  try {
    const number = req.query.number;
    if (!number) return res.status(400).send("❌ Please include your number");

    const cleanNum = number.replace(/[^0-9]/g, "");

    // Unique session ID starting with LUNA
    const sessionId = `LUNA_${Math.random().toString(36).substring(2, 8)}`;

    console.log(`📱 Generating pairing code for: ${cleanNum} (Session: ${sessionId})`);

    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);

    const client = makeWASocket({
      printQRInTerminal: false,
      logger: P({ level: "silent" }),
      browser: ["LUNA-BOT", "Safari", "2.3000.1"],
      version: [2, 3000, 1],
      auth: state,
    });

    client.ev.on("creds.update", saveCreds);

    // Generate pairing code (display immediately)
    await delay(2000);
    const code = await client.requestPairingCode(cleanNum);
    res.json({ code, sessionId }); // Send pairing code to browser

    // Listen for connection update
    client.ev.on("connection.update", async ({ connection }) => {
      if (connection === "open") {
        console.log("🟢 LUNA connected successfully!");
        // Send the session ID directly to user inbox
        await client.sendMessage(cleanNum + "@s.whatsapp.net", {
          text: `🔐 Your session ID: ${sessionId}\nUse it to restore or link your session anytime!`
        });
      }
    });

  } catch (err) {
    console.error("❌ Error generating pairing code:", err);
    res.status(503).send("Server error while generating code");
  }
});

app.listen(PORT, () => console.log(`🚀 LUNA Pair Server running on port ${PORT}`));
