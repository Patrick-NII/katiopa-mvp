-- CreateTable
CREATE TABLE "LearningCycle" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "mondayCompleted" BOOLEAN NOT NULL DEFAULT false,
    "tuesdayCompleted" BOOLEAN NOT NULL DEFAULT false,
    "wednesdayCompleted" BOOLEAN NOT NULL DEFAULT false,
    "thursdayCompleted" BOOLEAN NOT NULL DEFAULT false,
    "fridayCompleted" BOOLEAN NOT NULL DEFAULT false,
    "weekendCompleted" BOOLEAN NOT NULL DEFAULT false,
    "totalProgress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationAnalytics" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "communicationStyle" TEXT NOT NULL,
    "module" TEXT,
    "dayOfWeek" TEXT,
    "messageType" TEXT NOT NULL,
    "effectiveness" DOUBLE PRECISION NOT NULL,
    "responseTime" INTEGER,
    "userSatisfaction" INTEGER,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildPreferences" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "learningStyle" TEXT[],
    "interests" TEXT[],
    "preferredModules" TEXT[],
    "communicationStyle" TEXT,
    "difficultyPreference" TEXT,
    "sessionLength" INTEGER,
    "timeOfDay" TEXT[],
    "weeklyGoals" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningCycle_userSessionId_weekStartDate_key" ON "LearningCycle"("userSessionId", "weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "ChildPreferences_userSessionId_key" ON "ChildPreferences"("userSessionId");

-- AddForeignKey
ALTER TABLE "LearningCycle" ADD CONSTRAINT "LearningCycle_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationAnalytics" ADD CONSTRAINT "CommunicationAnalytics_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildPreferences" ADD CONSTRAINT "ChildPreferences_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
