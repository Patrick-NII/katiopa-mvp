-- CreateTable
CREATE TABLE "cubeai_exercises" (
    "id" TEXT NOT NULL,
    "exercise_type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correct_answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "time_limit" INTEGER NOT NULL DEFAULT 60,
    "context" JSONB NOT NULL,
    "child_session_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cubeai_exercises_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cubeai_exercises" ADD CONSTRAINT "cubeai_exercises_child_session_id_fkey" FOREIGN KEY ("child_session_id") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cubeai_exercises" ADD CONSTRAINT "cubeai_exercises_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
