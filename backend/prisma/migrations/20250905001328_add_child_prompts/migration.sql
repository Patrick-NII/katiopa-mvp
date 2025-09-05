-- CreateTable
CREATE TABLE "child_prompts" (
    "id" TEXT NOT NULL,
    "childMessage" TEXT NOT NULL,
    "bubixResponse" TEXT NOT NULL,
    "promptType" TEXT NOT NULL DEFAULT 'CHILD_CHAT',
    "activityType" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "engagement" TEXT,
    "status" "PromptStatus" NOT NULL DEFAULT 'PROCESSED',
    "child_session_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_prompts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "child_prompts" ADD CONSTRAINT "child_prompts_child_session_id_fkey" FOREIGN KEY ("child_session_id") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_prompts" ADD CONSTRAINT "child_prompts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
