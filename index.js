import express from "express";
import pairRouter from "./pair.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public")); // for HTML/CSS/JS files

// Root route
app.get("/", (req, res) => {
  res.sendFile(new URL("./public/main.html", import.meta.url));
});

// Use pairing router
app.use("/code", pairRouter);

app.listen(PORT, () => console.log(`🚀 LUNA Pair Server running on port ${PORT}`));
