import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import pool from "./db/psql.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const port = process.env.PORT || 3000;

app.use(cors());

import chatRouter from "./routes/chat.js";
import assistantRouter from "./routes/assistants.js";

app.use("/", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.send(result.rows);
    } catch (err) {
        console.log(err);
    }
});

app.use("/chat", chatRouter);
app.use("/assistants", assistantRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
