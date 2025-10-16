import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import codeRouter from "./pair.js";

const app = express();
const PORT = process.env.PORT || 3000;

// For __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static HTML files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "main.html"));
});

app.get("/pair", (req, res) => {
  res.sendFile(path.join(__dirname, "pair.html"));
});

// Pairing route
app.use("/code", codeRouter);

app.listen(PORT, () => console.log(`🚀 LUNA Pair Server running on port ${PORT}`));
