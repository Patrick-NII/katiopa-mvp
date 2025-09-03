/*
  Warnings:

  - You are about to drop the column `billingDate` on the `BillingRecord` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `NavigationSession` table. All the data in the column will be lost.
  - You are about to drop the column `actionsPerformed` on the `NavigationSession` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `NavigationSession` table. All the data in the column will be lost.
  - You are about to drop the column `pagesVisited` on the `NavigationSession` table. All the data in the column will be lost.
  - You are about to drop the column `sessionData` on the `NavigationSession` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `PerformanceMetric` table. All the data in the column will be lost.
  - You are about to drop the column `context` on the `PerformanceMetric` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `PerformanceMetric` table. All the data in the column will be lost.
  - You are about to drop the column `maxChildren` on the `PlanSeat` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `elementId` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `elementName` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `elementType` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `elementValue` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `pageTitle` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `pageUrl` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `sessionDuration` on the `UserInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `UserPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `UserPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `context` on the `UserPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `UserPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `modelUsed` on the `UserPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `promptType` on the `UserPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `responseTime` on the `UserPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `success` on the `UserPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `UserPrompt` table. All the data in the column will be lost.
  - You are about to drop the column `tokensUsed` on the `UserPrompt` table. All the data in the column will be lost.
  - Changed the type of `metricType` on the `PerformanceMetric` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `seatNumber` to the `PlanSeat` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `interactionType` on the `UserInteraction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `prompt` to the `UserPrompt` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('HELLO', 'SUPPORT', 'NOREPLY');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "IncomingEmailType" AS ENUM ('SUPPORT', 'HELLO', 'GENERAL');

-- CreateEnum
CREATE TYPE "EmailPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "IncomingEmailStatus" AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BounceType" AS ENUM ('HARD', 'SOFT', 'COMPLAINT');

-- DropForeignKey
ALTER TABLE "NavigationSession" DROP CONSTRAINT "NavigationSession_accountId_fkey";

-- DropForeignKey
ALTER TABLE "PerformanceMetric" DROP CONSTRAINT "PerformanceMetric_accountId_fkey";

-- DropForeignKey
ALTER TABLE "UserInteraction" DROP CONSTRAINT "UserInteraction_accountId_fkey";

-- DropForeignKey
ALTER TABLE "UserPrompt" DROP CONSTRAINT "UserPrompt_accountId_fkey";

-- AlterTable
ALTER TABLE "BillingRecord" DROP COLUMN "billingDate",
ADD COLUMN     "invoiceNumber" TEXT,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "dueDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NavigationSession" DROP COLUMN "accountId",
DROP COLUMN "actionsPerformed",
DROP COLUMN "duration",
DROP COLUMN "pagesVisited",
DROP COLUMN "sessionData",
ADD COLUMN     "pages" JSONB;

-- AlterTable
ALTER TABLE "PerformanceMetric" DROP COLUMN "accountId",
DROP COLUMN "context",
DROP COLUMN "unit",
DROP COLUMN "metricType",
ADD COLUMN     "metricType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlanSeat" DROP COLUMN "maxChildren",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "seatNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserInteraction" DROP COLUMN "accountId",
DROP COLUMN "elementId",
DROP COLUMN "elementName",
DROP COLUMN "elementType",
DROP COLUMN "elementValue",
DROP COLUMN "metadata",
DROP COLUMN "pageTitle",
DROP COLUMN "pageUrl",
DROP COLUMN "sessionDuration",
ADD COLUMN     "data" JSONB,
DROP COLUMN "interactionType",
ADD COLUMN     "interactionType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserPrompt" DROP COLUMN "accountId",
DROP COLUMN "content",
DROP COLUMN "context",
DROP COLUMN "errorMessage",
DROP COLUMN "modelUsed",
DROP COLUMN "promptType",
DROP COLUMN "responseTime",
DROP COLUMN "success",
DROP COLUMN "timestamp",
DROP COLUMN "tokensUsed",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "prompt" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ElementType";

-- DropEnum
DROP TYPE "InteractionType";

-- DropEnum
DROP TYPE "MetricType";

-- DropEnum
DROP TYPE "PromptType";

-- CreateTable
CREATE TABLE "ChildActivity" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "email_type" "EmailType" NOT NULL,
    "from_email" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT,
    "text_content" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "message_id" TEXT,
    "smtp_response" TEXT,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incoming_emails" (
    "id" SERIAL NOT NULL,
    "from_email" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "headers" JSONB,
    "message_id" TEXT,
    "email_type" "IncomingEmailType" NOT NULL DEFAULT 'SUPPORT',
    "priority" "EmailPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "IncomingEmailStatus" NOT NULL DEFAULT 'NEW',
    "assigned_to" TEXT,
    "ticket_id" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incoming_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email_type" "EmailType" NOT NULL,
    "subject_template" TEXT NOT NULL,
    "html_template" TEXT NOT NULL,
    "text_template" TEXT,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_statistics" (
    "id" SERIAL NOT NULL,
    "email_type" "EmailType" NOT NULL,
    "date" DATE NOT NULL,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "bounced_count" INTEGER NOT NULL DEFAULT 0,
    "opened_count" INTEGER NOT NULL DEFAULT 0,
    "clicked_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_bounces" (
    "id" SERIAL NOT NULL,
    "email_log_id" INTEGER,
    "email_address" TEXT NOT NULL,
    "bounce_type" "BounceType" NOT NULL,
    "reason" TEXT,
    "smtp_response" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_bounces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "child_nickname" TEXT NOT NULL,
    "child_age" INTEGER NOT NULL,
    "parent_email" TEXT NOT NULL,
    "goals" JSONB NOT NULL DEFAULT '{}',
    "consent_email" BOOLEAN NOT NULL DEFAULT true,
    "email_frequency" TEXT NOT NULL DEFAULT 'daily',
    "email_time" TEXT NOT NULL DEFAULT '19:30:00',
    "email_domains" TEXT[] DEFAULT ARRAY['maths', 'programmation', 'playcube']::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domain" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "success_ratio" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_results" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "module" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "time_sec" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_stats_daily" (
    "session_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_time_min" INTEGER NOT NULL DEFAULT 0,
    "kpi_assiduite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kpi_comprehension" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kpi_progression" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessions_count" INTEGER NOT NULL DEFAULT 0,
    "best_module" TEXT,
    "needs_help" TEXT,
    "consecutive_days" INTEGER NOT NULL DEFAULT 0,
    "focus_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_stats_daily_pkey" PRIMARY KEY ("session_id","date")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "model_used" TEXT NOT NULL,
    "prompt_used" TEXT,
    "kpis_snapshot" JSONB NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parent_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_preferences" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "preferred_time" TEXT NOT NULL DEFAULT '19:30:00',
    "domains" TEXT[] DEFAULT ARRAY['maths', 'programmation', 'playcube']::TEXT[],
    "include_goals" BOOLEAN NOT NULL DEFAULT true,
    "include_advice" BOOLEAN NOT NULL DEFAULT true,
    "include_stats" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "email_statistics_email_type_date_key" ON "email_statistics"("email_type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "report_preferences_account_id_key" ON "report_preferences"("account_id");

-- AddForeignKey
ALTER TABLE "ChildActivity" ADD CONSTRAINT "ChildActivity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_bounces" ADD CONSTRAINT "email_bounces_email_log_id_fkey" FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_stats_daily" ADD CONSTRAINT "session_stats_daily_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_preferences" ADD CONSTRAINT "report_preferences_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
