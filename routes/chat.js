// routes/chat.js
import { Router } from "express";
const router = Router();
import { openai, assistant, thread, vectorStore } from "../assistant.js";
import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage: storage });

router.get("/", (req, res) => {
    res.send("Hello Chat");
});

router.post("/message", async (req, res) => {
    const { message } = req.body;
    console.log(`input: ${message}`);
    await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: message,
    });
    const run = openai.beta.threads.runs
        .stream(thread.id, {
            assistant_id: assistant.id,
        })
        .on("textCreated", (text) => process.stdout.write("\nassistant > "))
        .on("textDelta", (textDelta, snapshot) =>
            process.stdout.write(textDelta.value)
        )
        .on("toolCallCreated", (toolCall) =>
            process.stdout.write(`\nassistant > ${toolCall.type}\n\n`)
        )
        .on("toolCallDelta", (toolCallDelta, snapshot) => {
            if (toolCallDelta.type === "code_interpreter") {
                if (toolCallDelta.code_interpreter.input) {
                    process.stdout.write(toolCallDelta.code_interpreter.input);
                }
                if (toolCallDelta.code_interpreter.outputs) {
                    process.stdout.write("\noutput >\n");
                    toolCallDelta.code_interpreter.outputs.forEach((output) => {
                        if (output.type === "logs") {
                            process.stdout.write(`\n${output.logs}\n`);
                        }
                    });
                }
            }
        })
        .on("end", async () => {
            process.stdout.write("\n");
            const msg = await run.finalMessages();
            console.log(`final message: ${msg[0].content[0].text.value}`);
            res.json({ response: msg[0].content[0].text.value });
        });
});

router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const filePath = req.file.path;

        // OpenAI API에 파일 업로드
        const file = await openai.files.create({
            file: fs.createReadStream(filePath),
            purpose: "assistants",
        });

        console.log(file);

        const myVectorStoreFile = await openai.beta.vectorStores.files.create(
            vectorStore.id,
            {
                file_id: file.id,
            }
        );

        console.log(myVectorStoreFile);

        res.json({
            message: `File uploaded and sent to OpenAI successfully: ${req.file.originalname}`,
            openaiResponse: file,
        });
    } catch (error) {
        console.error("Error uploading file to OpenAI:", error);
        res.status(500).send("Error uploading file to OpenAI");
    }
});

export default router;
