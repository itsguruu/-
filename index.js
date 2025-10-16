import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pairRouter from "./pair.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Pairing route
app.use("/code", pairRouter);

app.listen(PORT, () => console.log(`🚀 LUNA Pair Server running on port ${PORT}`));
