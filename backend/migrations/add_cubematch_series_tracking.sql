-- Migration: Ajout du tracking des séries et sessions pour CubeMatch
-- Date: 2024-01-XX
-- Description: Ajout des champs pour le nouveau système de validation avec timer

-- 1. Ajouter session_id à cubematch_scores pour tracking comportemental
ALTER TABLE "cubematch_scores" ADD COLUMN "session_id" VARCHAR(255);

-- 2. Ajouter les nouveaux champs pour le système de séries
ALTER TABLE "cubematch_scores" ADD COLUMN "series_data" JSONB;
ALTER TABLE "cubematch_scores" ADD COLUMN "validation_timer_ms" INTEGER DEFAULT 5000;
ALTER TABLE "cubematch_scores" ADD COLUMN "series_attempts" INTEGER DEFAULT 0;
ALTER TABLE "cubematch_scores" ADD COLUMN "series_correct" INTEGER DEFAULT 0;
ALTER TABLE "cubematch_scores" ADD COLUMN "series_accuracy" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "cubematch_scores" ADD COLUMN "consecutive_errors" INTEGER DEFAULT 0;
ALTER TABLE "cubematch_scores" ADD COLUMN "long_decompositions_count" INTEGER DEFAULT 0;
ALTER TABLE "cubematch_scores" ADD COLUMN "auto_validation_enabled" BOOLEAN DEFAULT true;

-- 3. Créer la table pour les séries de calculs détaillées
CREATE TABLE "cubematch_series" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" VARCHAR(255),
    "score_id" TEXT NOT NULL,
    "series_number" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "validation_timer_ms" INTEGER NOT NULL DEFAULT 5000,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "incorrect_answers" INTEGER NOT NULL DEFAULT 0,
    "timeout_count" INTEGER NOT NULL DEFAULT 0,
    "series_accuracy" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "average_response_time_ms" INTEGER DEFAULT 0,
    "fastest_response_ms" INTEGER DEFAULT 0,
    "slowest_response_ms" INTEGER DEFAULT 0,
    "long_decompositions" INTEGER DEFAULT 0,
    "operator_used" VARCHAR(10) NOT NULL,
    "target_value" INTEGER NOT NULL,
    "difficulty_level" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cubematch_series_pkey" PRIMARY KEY ("id")
);

-- 4. Créer la table pour les tentatives individuelles dans chaque série
CREATE TABLE "cubematch_series_attempts" (
    "id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "selected_numbers" JSONB NOT NULL,
    "target_value" INTEGER NOT NULL,
    "operator" VARCHAR(10) NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "attempt_type" VARCHAR(20) NOT NULL, -- 'correct', 'incorrect', 'timeout'
    "numbers_count" INTEGER NOT NULL,
    "is_long_decomposition" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cubematch_series_attempts_pkey" PRIMARY KEY ("id")
);

-- 5. Créer la table d'agrégation quotidienne pour optimiser les performances
CREATE TABLE "cubematch_daily_aggregates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_games" INTEGER NOT NULL DEFAULT 0,
    "total_score" BIGINT NOT NULL DEFAULT 0,
    "average_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "best_score" INTEGER NOT NULL DEFAULT 0,
    "total_time_played_ms" BIGINT NOT NULL DEFAULT 0,
    "average_accuracy" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_series" INTEGER NOT NULL DEFAULT 0,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "total_correct_answers" INTEGER NOT NULL DEFAULT 0,
    "average_response_time_ms" INTEGER NOT NULL DEFAULT 0,
    "long_decompositions_count" INTEGER NOT NULL DEFAULT 0,
    "timeout_count" INTEGER NOT NULL DEFAULT 0,
    "operators_used" JSONB,
    "difficulty_levels" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cubematch_daily_aggregates_pkey" PRIMARY KEY ("id")
);

-- 6. Créer les index pour optimiser les performances
CREATE INDEX "cubematch_scores_session_id_idx" ON "cubematch_scores"("session_id");
CREATE INDEX "cubematch_scores_user_id_created_at_idx" ON "cubematch_scores"("user_id", "created_at");
CREATE INDEX "cubematch_series_user_id_idx" ON "cubematch_series"("user_id");
CREATE INDEX "cubematch_series_session_id_idx" ON "cubematch_series"("session_id");
CREATE INDEX "cubematch_series_score_id_idx" ON "cubematch_series"("score_id");
CREATE INDEX "cubematch_series_attempts_series_id_idx" ON "cubematch_series_attempts"("series_id");
CREATE INDEX "cubematch_daily_aggregates_user_id_date_idx" ON "cubematch_daily_aggregates"("user_id", "date");

-- 7. Ajouter les contraintes de clés étrangères
ALTER TABLE "cubematch_series" ADD CONSTRAINT "cubematch_series_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE;
ALTER TABLE "cubematch_series" ADD CONSTRAINT "cubematch_series_score_id_fkey" 
    FOREIGN KEY ("score_id") REFERENCES "cubematch_scores"("id") ON DELETE CASCADE;
ALTER TABLE "cubematch_series_attempts" ADD CONSTRAINT "cubematch_series_attempts_series_id_fkey" 
    FOREIGN KEY ("series_id") REFERENCES "cubematch_series"("id") ON DELETE CASCADE;
ALTER TABLE "cubematch_daily_aggregates" ADD CONSTRAINT "cubematch_daily_aggregates_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE;

-- 8. Créer une contrainte unique pour éviter les doublons d'agrégation
CREATE UNIQUE INDEX "cubematch_daily_aggregates_user_date_unique" 
    ON "cubematch_daily_aggregates"("user_id", "date");

