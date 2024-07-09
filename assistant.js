import OpenAI from "openai";
import { config } from "dotenv";
config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const assistant = await openai.beta.assistants.create({
    name: "Math Tutor",
    instructions:
        "You are a personal math tutor. Write and run code to answer math questions.",
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4o",
    temperature: 0.2,
});

const thread = await openai.beta.threads.create();

const vectorStore = await openai.beta.vectorStores.create({
    name: "My vector-store",
});

export { openai, assistant, thread, vectorStore };
