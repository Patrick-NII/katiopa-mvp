-- CreateEnum
CREATE TYPE "PromptStatus" AS ENUM ('PENDING', 'PROCESSED', 'ERROR');

-- CreateTable
CREATE TABLE "parent_prompts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "processedContent" TEXT,
    "aiResponse" TEXT,
    "promptType" TEXT NOT NULL DEFAULT 'PARENT_NOTES',
    "status" "PromptStatus" NOT NULL DEFAULT 'PENDING',
    "parent_session_id" TEXT NOT NULL,
    "child_session_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cubeai_conversations" (
    "id" TEXT NOT NULL,
    "user_message" TEXT NOT NULL,
    "ai_response" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "promptType" TEXT NOT NULL DEFAULT 'GENERAL',
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "child_session_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cubeai_conversations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "parent_prompts" ADD CONSTRAINT "parent_prompts_parent_session_id_fkey" FOREIGN KEY ("parent_session_id") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_prompts" ADD CONSTRAINT "parent_prompts_child_session_id_fkey" FOREIGN KEY ("child_session_id") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_prompts" ADD CONSTRAINT "parent_prompts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cubeai_conversations" ADD CONSTRAINT "cubeai_conversations_child_session_id_fkey" FOREIGN KEY ("child_session_id") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cubeai_conversations" ADD CONSTRAINT "cubeai_conversations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
