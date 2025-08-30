/*
  Warnings:

  - Made the column `dueDate` on table `BillingRecord` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('CLICK', 'INPUT', 'SUBMIT', 'NAVIGATION', 'SCROLL', 'HOVER', 'FOCUS', 'BLUR', 'KEYPRESS', 'MOUSE_MOVE', 'TOUCH', 'GESTURE', 'VOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "ElementType" AS ENUM ('BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'RADIO', 'LINK', 'TAB', 'CARD', 'MODAL', 'SIDEBAR', 'HEADER', 'FOOTER', 'NAVIGATION', 'FORM', 'CHAT_INPUT', 'AI_RESPONSE', 'EXERCISE', 'GAME', 'VIDEO', 'AUDIO', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('CHAT_MESSAGE', 'EXERCISE_QUESTION', 'AI_ASSISTANCE', 'SEARCH', 'FILTER', 'SORT', 'EXPORT', 'IMPORT', 'SETTINGS', 'FEEDBACK', 'SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('LOAD_TIME', 'RESPONSE_TIME', 'CLICK_RATE', 'CONVERSION_RATE', 'ENGAGEMENT_TIME', 'ERROR_RATE', 'SUCCESS_RATE', 'SATISFACTION_SCORE', 'USAGE_FREQUENCY', 'FEATURE_USAGE', 'OTHER');

-- AlterEnum
ALTER TYPE "BillingStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "score" DROP NOT NULL,
ALTER COLUMN "durationMs" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BillingRecord" ALTER COLUMN "billingDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "dueDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "focus" TEXT,
    "context" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSeat" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "maxChildren" INTEGER NOT NULL,

    CONSTRAINT "PlanSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "interactionType" "InteractionType" NOT NULL,
    "elementType" "ElementType" NOT NULL,
    "elementId" TEXT,
    "elementName" TEXT,
    "elementValue" TEXT,
    "pageUrl" TEXT,
    "pageTitle" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "sessionDuration" INTEGER,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPrompt" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "promptType" "PromptType" NOT NULL,
    "content" TEXT NOT NULL,
    "context" JSONB,
    "response" TEXT,
    "responseTime" INTEGER,
    "tokensUsed" INTEGER,
    "modelUsed" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationSession" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "pagesVisited" TEXT[],
    "actionsPerformed" INTEGER NOT NULL DEFAULT 0,
    "sessionData" JSONB,

    CONSTRAINT "NavigationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "metricType" "MetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanSeat_accountId_key" ON "PlanSeat"("accountId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSeat" ADD CONSTRAINT "PlanSeat_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrompt" ADD CONSTRAINT "UserPrompt_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrompt" ADD CONSTRAINT "UserPrompt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationSession" ADD CONSTRAINT "NavigationSession_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationSession" ADD CONSTRAINT "NavigationSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
