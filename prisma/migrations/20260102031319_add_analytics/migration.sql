-- AlterTable
ALTER TABLE "users" ADD COLUMN     "subscription" TEXT;

-- CreateTable
CREATE TABLE "site_visits" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "page" TEXT,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_popularity" (
    "id" SERIAL NOT NULL,
    "gameName" TEXT NOT NULL,
    "platform" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_popularity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_popularity_gameName_platform_key" ON "game_popularity"("gameName", "platform");
