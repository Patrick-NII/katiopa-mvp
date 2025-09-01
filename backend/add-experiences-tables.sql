-- Script pour ajouter les nouvelles tables pour les expériences CubeAI
-- À exécuter sur la base de données existante

-- Créer les nouveaux types ENUM
CREATE TYPE "GameType" AS ENUM ('PUZZLE', 'ADVENTURE', 'SIMULATION', 'QUIZ', 'MEMORY', 'LOGIC', 'STRATEGY', 'ACTION', 'CREATIVE', 'EDUCATIONAL', 'OTHER');
CREATE TYPE "GameDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');
CREATE TYPE "ExerciseDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');
CREATE TYPE "ScheduleType" AS ENUM ('COURSE', 'EXERCISE', 'PROJECT', 'REVISION', 'BREAK', 'GAME', 'ASSESSMENT', 'SUPPORT', 'OTHER');
CREATE TYPE "ScheduleStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');
CREATE TYPE "SchedulePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "WelcomeMessageType" AS ENUM ('DAILY_GREETING', 'WEEKLY_SUMMARY', 'ACHIEVEMENT', 'MOTIVATION', 'RECOMMENDATION', 'REMINDER', 'WELCOME_NEW_USER', 'OTHER');
CREATE TYPE "RecommendationType" AS ENUM ('GAME', 'EXERCISE', 'SCHEDULE', 'LEARNING_PATH', 'BREAK', 'OTHER');

-- Table des jeux éducatifs
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" "GameType" NOT NULL,
    "difficulty" "GameDifficulty" NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "tags" TEXT[] NOT NULL,
    "thumbnail" TEXT,
    "gameUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- Table des sessions de jeu
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "score" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- Table des évaluations des jeux
CREATE TABLE "GameRating" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRating_pkey" PRIMARY KEY ("id")
);

-- Table des exercices
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "difficulty" "ExerciseDifficulty" NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "tags" TEXT[] NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- Table des tentatives d'exercices
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "score" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "answers" JSONB,
    "feedback" TEXT,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- Table des évaluations des exercices
CREATE TABLE "ExerciseRating" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseRating_pkey" PRIMARY KEY ("id")
);

-- Table du planning
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" "SchedulePriority" NOT NULL DEFAULT 'MEDIUM',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- Table des messages d'accueil
CREATE TABLE "WelcomeMessage" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "messageType" "WelcomeMessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "context" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WelcomeMessage_pkey" PRIMARY KEY ("id")
);

-- Table des recommandations
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- Ajouter les contraintes de clés étrangères
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GameRating" ADD CONSTRAINT "GameRating_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameRating" ADD CONSTRAINT "GameRating_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameRating" ADD CONSTRAINT "GameRating_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExerciseRating" ADD CONSTRAINT "ExerciseRating_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExerciseRating" ADD CONSTRAINT "ExerciseRating_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExerciseRating" ADD CONSTRAINT "ExerciseRating_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WelcomeMessage" ADD CONSTRAINT "WelcomeMessage_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WelcomeMessage" ADD CONSTRAINT "WelcomeMessage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Créer des index pour améliorer les performances
CREATE INDEX "Game_domain_idx" ON "Game"("domain");
CREATE INDEX "Game_type_idx" ON "Game"("type");
CREATE INDEX "Game_difficulty_idx" ON "Game"("difficulty");
CREATE INDEX "Game_rating_idx" ON "Game"("rating");

CREATE INDEX "Exercise_domain_idx" ON "Exercise"("domain");
CREATE INDEX "Exercise_difficulty_idx" ON "Exercise"("difficulty");
CREATE INDEX "Exercise_rating_idx" ON "Exercise"("rating");

CREATE INDEX "Schedule_userSessionId_idx" ON "Schedule"("userSessionId");
CREATE INDEX "Schedule_startTime_idx" ON "Schedule"("startTime");
CREATE INDEX "Schedule_type_idx" ON "Schedule"("type");

CREATE INDEX "WelcomeMessage_userSessionId_idx" ON "WelcomeMessage"("userSessionId");
CREATE INDEX "WelcomeMessage_isActive_idx" ON "WelcomeMessage"("isActive");

CREATE INDEX "Recommendation_userSessionId_idx" ON "Recommendation"("userSessionId");
CREATE INDEX "Recommendation_type_idx" ON "Recommendation"("type");
CREATE INDEX "Recommendation_score_idx" ON "Recommendation"("score");

-- Insérer quelques jeux et exercices de démonstration
INSERT INTO "Game" ("id", "title", "description", "domain", "type", "difficulty", "estimatedTime", "minAge", "maxAge", "tags", "rating", "totalPlays", "completionRate") VALUES
('game_math_puzzle_1', 'MathQuest: Addition Aventure', 'Aventure mathématique pour apprendre les additions', 'Mathématiques', 'ADVENTURE', 'EASY', 15, 6, 10, ARRAY['math', 'addition', 'aventure'], 4.5, 150, 85.5),
('game_french_quiz_1', 'Quiz Français: Vocabulaire', 'Quiz interactif pour enrichir le vocabulaire', 'Français', 'QUIZ', 'MEDIUM', 20, 8, 12, ARRAY['français', 'vocabulaire', 'quiz'], 4.2, 120, 78.3),
('game_science_sim_1', 'ScienceLab: Expériences', 'Simulation d''expériences scientifiques', 'Sciences', 'SIMULATION', 'HARD', 25, 10, 15, ARRAY['sciences', 'expériences', 'simulation'], 4.8, 80, 92.1);

INSERT INTO "Exercise" ("id", "title", "description", "domain", "difficulty", "estimatedTime", "content", "tags", "rating", "totalAttempts", "successRate") VALUES
('ex_math_add_1', 'Addition avec retenue', 'Exercices d''addition avec retenue pour débutants', 'Mathématiques', 'EASY', 15, '{"questions": [{"id": 1, "text": "25 + 17 = ?", "answer": 42, "explanation": "25 + 17 = 42 (retenue de 1)"}]}', ARRAY['math', 'addition', 'retenue'], 4.3, 200, 82.5),
('ex_french_gram_1', 'Conjugaison présent', 'Exercices de conjugaison au présent', 'Français', 'MEDIUM', 20, '{"questions": [{"id": 1, "text": "Conjuguer 'manger' à la 1ère personne du pluriel", "answer": "nous mangeons", "explanation": "Au présent, nous mangeons"}]}', ARRAY['français', 'conjugaison', 'présent'], 4.1, 180, 75.8),
('ex_science_log_1', 'Logique scientifique', 'Exercices de logique et raisonnement scientifique', 'Sciences', 'HARD', 25, '{"questions": [{"id": 1, "text": "Si A > B et B > C, alors A ? C", "answer": "A > C", "explanation": "Propriété transitive de l''ordre"}]}', ARRAY['sciences', 'logique', 'raisonnement'], 4.6, 120, 88.9);

-- Message de confirmation
SELECT 'Tables des expériences CubeAI créées avec succès !' as message;
