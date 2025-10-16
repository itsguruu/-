import express from "express";
import bodyParser from "body-parser";
import pairRouter from "./pair.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve main page
app.get("/", (req, res) => {
  res.send("<h1>💫 LUNA Pairing Server is alive!</h1>");
});

// Use pairing router
app.use("/code", pairRouter);

app.listen(PORT, () => {
  console.log(`🚀 LUNA Pair Server running on port ${PORT}`);
});
