import express from "express";
import path from "path";
import bodyParser from "body-parser";
import codeRouter from "./pair.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Serve HTML files
const __dirname = path.resolve();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/code", codeRouter);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/main.html");
});

app.get("/pair", (req, res) => {
  res.sendFile(__dirname + "/pair.html");
});

app.listen(PORT, () => console.log(`🚀 LUNA Pair Server running on port ${PORT}`));
