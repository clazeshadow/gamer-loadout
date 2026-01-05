-- CreateTable
CREATE TABLE "chat_cache" (
    "id" SERIAL NOT NULL,
    "promptHash" TEXT NOT NULL,
    "prompt" TEXT,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_cache_promptHash_key" ON "chat_cache"("promptHash");
