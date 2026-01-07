-- CreateTable
CREATE TABLE "community_messages" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_messages_createdAt_idx" ON "community_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
