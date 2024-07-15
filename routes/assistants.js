import { Router } from "express";
const router = Router();
import multer from "multer";
import { openai } from "../openai.js";
import path from "path";
import fs from "fs";
import pool from "../db/psql.js";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

// 파일 필터 설정: 텍스트 파일만 허용
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "text/plain") {
        cb(null, true);
    } else {
        cb(new Error("Only .txt files are allowed"), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM assistants");
        res.status(200).json({ data: result.rows });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "An error occurred while fetching data.",
        });
    }
});

router.post("/create", upload.array("files"), async (req, res, err) => {
    try {
        const { assistant_name, description, instruction } = req.body;

        const filePaths = req.files.map((file) =>
            path.join(__dirname, "../", file.path)
        );

        const fileStreams = filePaths.map((filePath) =>
            fs.createReadStream(filePath)
        );

        let assistant = await openai.beta.assistants.create({
            name: assistant_name,
            description: description,
            tools: [{ type: "file_search" }],
            instructions: instruction,
            model: "gpt-4o",
            temperature: 0.2,
        });

        const vectorStore = await openai.beta.vectorStores.create({
            name: `vectorStore for ${assistant_name}`,
        });

        await openai.beta.vectorStores.fileBatches.uploadAndPoll(
            vectorStore.id,
            {
                files: fileStreams,
            }
        );

        assistant = await openai.beta.assistants.update(assistant.id, {
            tool_resources: {
                file_search: {
                    vector_store_ids: [vectorStore.id],
                },
            },
        });

        const result = await pool.query(
            `
            INSERT INTO "Assistants" 
              ("assistantId", "assistant_name", "vectorStoreId", "description", "instruction") 
            VALUES 
              ($1, $2, $3, $4, $5)
            RETURNING *;`,
            [
                assistant.id,
                assistant.name,
                vectorStore.id,
                assistant.description,
                assistant.instructions,
            ]
        );
        res.status(201).json({ assistant, data: result.rows[0] });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
