import express from "express";
import { makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import P from "pino";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(`
    <center>
      <h1>🌙 LUNA Pairing Server</h1>
      <p>Welcome to LUNA's WhatsApp Pairing System</p>
      <p>Enter your number in full international format (example: 254712345678)</p>
      <form action="/code" method="get">
        <input type="text" name="number" placeholder="Enter your number" required style="padding:8px;border-radius:5px;">
        <button type="submit" style="padding:8px 16px;border:none;background:#4CAF50;color:white;border-radius:5px;">Get Pairing Code</button>
      </form>
      <p>💬 Created by <b>@itsguruu</b></p>
    </center>
  `);
});

app.get("/code", async (req, res) => {
  try {
    const number = req.query.number;
    if (!number) return res.status(400).send("❌ Please include your number in the URL.");

    const cleanNum = number.replace(/[^0-9]/g, "");
    const sessionId = `LUNA_${Date.now()}`;

    console.log(`📱 Generating code for: ${cleanNum} (Session: ${sessionId})`);

    // Create session folder if missing
    if (!fs.existsSync("./sessions")) fs.mkdirSync("./sessions");

    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);

    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
      version,
      printQRInTerminal: false,
      logger: P({ level: "silent" }),
      browser: ["LUNA", "Safari", "1.0.0"],
      auth: state,
    });

    client.ev.on("creds.update", saveCreds);

    // Wait to ensure full initialization
    await delay(4000);

    const code = await client.requestPairingCode(cleanNum);
    console.log(`✅ Pairing code for ${cleanNum}: ${code}`);

    res.status(200).send(`
      <center>
        <h2>🔐 Your LUNA Pairing Code:</h2>
        <h1 style="color:#4CAF50;">${code}</h1>
        <p>Enter this code into WhatsApp on your device to connect with LUNA.</p>
        <p>🌙 Stay connected with @itsguruu</p>
      </center>
    `);

    client.ev.on("connection.update", ({ connection }) => {
      if (connection === "open") console.log("🟢 LUNA connected successfully!");
      if (connection === "close") console.log("⚠️ LUNA connection closed.");
    });

  } catch (err) {
    console.error("❌ Error generating pairing code:", err);
    res.status(500).send("❌ Error generating pairing code. Please try again.");
  }
});

app.listen(PORT, () => console.log(`🚀 LUNA Pair Server running on port ${PORT}`));
