-- CreateEnum
CREATE TYPE "CompetenceType" AS ENUM ('MATHEMATIQUES', 'PROGRAMMATION', 'CREATIVITE', 'COLLABORATION', 'CONCENTRATION', 'RESOLUTION_PROBLEMES', 'COMMUNICATION', 'CONNAISSANCES_GENERALES', 'SENS_CRITIQUE', 'REFLEXION_LOGIQUE');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('QUIZ', 'INTERACTIF', 'CREATIF', 'COLLABORATIF', 'REFLEXION', 'PRATIQUE');

-- CreateTable
CREATE TABLE "Competence" (
    "id" TEXT NOT NULL,
    "type" "CompetenceType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "estimatedTime" INTEGER NOT NULL DEFAULT 10,
    "instructions" JSONB,
    "content" JSONB,
    "solution" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB,
    "feedback" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetenceAssessment" (
    "id" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'Débutant',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetenceAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BubixAnalysis" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "recommendations" JSONB,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BubixAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competence_type_key" ON "Competence"("type");

-- CreateIndex
CREATE UNIQUE INDEX "CompetenceAssessment_competenceId_userSessionId_key" ON "CompetenceAssessment"("competenceId", "userSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "BubixAnalysis_userSessionId_competenceId_date_key" ON "BubixAnalysis"("userSessionId", "competenceId", "date");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "Competence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenceAssessment" ADD CONSTRAINT "CompetenceAssessment_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "Competence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenceAssessment" ADD CONSTRAINT "CompetenceAssessment_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BubixAnalysis" ADD CONSTRAINT "BubixAnalysis_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BubixAnalysis" ADD CONSTRAINT "BubixAnalysis_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "Competence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
