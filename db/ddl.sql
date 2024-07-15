CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "provider" VARCHAR(50) NOT NULL,
  "username" VARCHAR(50),
  "email" VARCHAR(100) NOT NULL,
  "password" VARCHAR(100),
  "name" VARCHAR(100),
  "googleId" VARCHAR(100),
  "kakaoId" VARCHAR(100),
  "createdAt" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "stripeCustomerId" VARCHAR(100),
  "admin" BOOLEAN,
  "currency" VARCHAR(10),
  "clientId" VARCHAR(100),
  "metadata" JSON
);

CREATE TABLE "Assistants" (
  "assistantId" VARCHAR(50) PRIMARY KEY,
  "assistant_name" VARCHAR(50) NOT NULL,
  "vectorStoreId" VARCHAR(50) NOT NULL,
  "description" TEXT DEFAULT (""),
  "instruction" TEXT DEFAULT (""),
  "createdAt" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updatedAt" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "Threads" (
  "threadId" VARCHAR(50) PRIMARY KEY,
  "userId" INT NOT NULL,
  "assistantId" VARCHAR(50) NOT NULL,
  "customPrompt" TEXT DEFAULT (""),
  "createdAt" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "updatedAt" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "last_message" TEXT DEFAULT ("")
);

ALTER TABLE "Threads" ADD FOREIGN KEY ("userId") REFERENCES "Users" ("id");

ALTER TABLE "Threads" ADD FOREIGN KEY ("assistantId") REFERENCES "Assistants" ("assistantId");