-- AlterTable
ALTER TABLE "ChildActivity" ADD COLUMN     "learningSessionId" TEXT;

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER NOT NULL,
    "breaks" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "mood" TEXT,
    "notes" TEXT,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentPreferences" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "childStrengths" TEXT[],
    "focusAreas" TEXT[],
    "learningGoals" TEXT[],
    "concerns" TEXT[],
    "preferredSchedule" JSONB NOT NULL,
    "studyDuration" INTEGER NOT NULL DEFAULT 30,
    "breakFrequency" INTEGER NOT NULL DEFAULT 15,
    "learningStyle" TEXT,
    "motivationFactors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentPreferences_userSessionId_key" ON "ParentPreferences"("userSessionId");

-- AddForeignKey
ALTER TABLE "ChildActivity" ADD CONSTRAINT "ChildActivity_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentPreferences" ADD CONSTRAINT "ParentPreferences_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
