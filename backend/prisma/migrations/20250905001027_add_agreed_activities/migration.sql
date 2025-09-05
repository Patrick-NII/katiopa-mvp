/*
  Warnings:

  - You are about to drop the `cubeai_conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cubeai_exercises` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING', 'PROPOSED', 'ACCEPTED', 'COMPLETED', 'DECLINED');

-- DropForeignKey
ALTER TABLE "cubeai_conversations" DROP CONSTRAINT "cubeai_conversations_account_id_fkey";

-- DropForeignKey
ALTER TABLE "cubeai_conversations" DROP CONSTRAINT "cubeai_conversations_child_session_id_fkey";

-- DropForeignKey
ALTER TABLE "cubeai_exercises" DROP CONSTRAINT "cubeai_exercises_account_id_fkey";

-- DropForeignKey
ALTER TABLE "cubeai_exercises" DROP CONSTRAINT "cubeai_exercises_child_session_id_fkey";

-- DropTable
DROP TABLE "cubeai_conversations";

-- DropTable
DROP TABLE "cubeai_exercises";

-- CreateTable
CREATE TABLE "AgreedActivity" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "childSessionId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parentRequest" TEXT NOT NULL,
    "bubixResponse" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgreedActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cubematch_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "score" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "time_played_ms" BIGINT NOT NULL,
    "operator" VARCHAR(10) NOT NULL,
    "target" INTEGER NOT NULL,
    "allow_diagonals" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cubematch_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cubematch_stats" (
    "id" TEXT NOT NULL,
    "total_games" BIGINT NOT NULL DEFAULT 0,
    "total_score" BIGINT NOT NULL DEFAULT 0,
    "average_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "best_score" INTEGER NOT NULL DEFAULT 0,
    "total_time_played" BIGINT NOT NULL DEFAULT 0,
    "average_time_played" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "highest_level" INTEGER NOT NULL DEFAULT 1,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_players" INTEGER NOT NULL DEFAULT 0,
    "average_level" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "most_used_operator" VARCHAR(10) NOT NULL DEFAULT 'ADD',

    CONSTRAINT "cubematch_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cubematch_user_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "total_games" INTEGER NOT NULL DEFAULT 0,
    "total_score" BIGINT NOT NULL DEFAULT 0,
    "best_score" INTEGER NOT NULL DEFAULT 0,
    "average_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "highest_level" INTEGER NOT NULL DEFAULT 1,
    "total_time_played" BIGINT NOT NULL DEFAULT 0,
    "average_time_played" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_combo_max" INTEGER NOT NULL DEFAULT 0,
    "total_cells_cleared" INTEGER NOT NULL DEFAULT 0,
    "total_hints_used" INTEGER NOT NULL DEFAULT 0,
    "favorite_operator" VARCHAR(10) NOT NULL DEFAULT 'ADD',
    "last_played" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cubematch_user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cubematch_user_stats_user_id_key" ON "cubematch_user_stats"("user_id");

-- AddForeignKey
ALTER TABLE "AgreedActivity" ADD CONSTRAINT "AgreedActivity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreedActivity" ADD CONSTRAINT "AgreedActivity_childSessionId_fkey" FOREIGN KEY ("childSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cubematch_scores" ADD CONSTRAINT "cubematch_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cubematch_user_stats" ADD CONSTRAINT "cubematch_user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
