-- Migration pour ajouter les tables NuméroMagic
-- Créée le: $(date)
-- Description: Système de jeu NuméroMagic avec scores, rounds et statistiques utilisateur

-- ========================================
-- 1. Table des scores NuméroMagic
-- ========================================
CREATE TABLE IF NOT EXISTS "numeromagic_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    
    -- Informations de base
    "score" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "time_played_ms" INTEGER NOT NULL,
    
    -- Configuration du jeu
    "game_mode" TEXT NOT NULL DEFAULT 'CLASSIC',
    "difficulty_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "max_number" INTEGER NOT NULL DEFAULT 100,
    "operations_allowed" JSONB NOT NULL,
    
    -- Métriques de performance
    "total_rounds" INTEGER NOT NULL DEFAULT 0,
    "successful_rounds" INTEGER NOT NULL DEFAULT 0,
    "failed_rounds" INTEGER NOT NULL DEFAULT 0,
    "accuracy_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Métriques de temps
    "average_solve_time_ms" INTEGER,
    "fastest_solve_ms" INTEGER,
    "slowest_solve_ms" INTEGER,
    
    -- Combos et streaks
    "max_combo" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    
    -- Métriques par opération
    "additions_count" INTEGER NOT NULL DEFAULT 0,
    "subtractions_count" INTEGER NOT NULL DEFAULT 0,
    "multiplications_count" INTEGER NOT NULL DEFAULT 0,
    "divisions_count" INTEGER NOT NULL DEFAULT 0,
    
    "additions_success" INTEGER NOT NULL DEFAULT 0,
    "subtractions_success" INTEGER NOT NULL DEFAULT 0,
    "multiplications_success" INTEGER NOT NULL DEFAULT 0,
    "divisions_success" INTEGER NOT NULL DEFAULT 0,
    
    -- Données avancées
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "perfect_rounds" INTEGER NOT NULL DEFAULT 0,
    "numbers_discovered" JSONB,
    "patterns_used" JSONB,
    
    -- Métriques cognitives (pour BubiX)
    "cognitive_profile" JSONB,
    "engagement_score" INTEGER NOT NULL DEFAULT 0,
    "flow_score" INTEGER NOT NULL DEFAULT 0,
    
    -- Métadonnées
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "numeromagic_scores_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "numeromagic_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ========================================
-- 2. Table des rounds NuméroMagic
-- ========================================
CREATE TABLE IF NOT EXISTS "numeromagic_rounds" (
    "id" TEXT NOT NULL,
    "score_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    
    -- Données du défi
    "target_number" INTEGER NOT NULL,
    "given_numbers" JSONB NOT NULL,
    "operations_available" JSONB NOT NULL,
    
    -- Solution du joueur
    "player_solution" JSONB,
    "is_correct" BOOLEAN NOT NULL,
    "solve_time_ms" INTEGER NOT NULL,
    
    -- Métriques du round
    "attempts_count" INTEGER NOT NULL DEFAULT 1,
    "hints_used_in_round" INTEGER NOT NULL DEFAULT 0,
    "operations_used" JSONB NOT NULL,
    
    -- Performance
    "was_perfect" BOOLEAN NOT NULL DEFAULT false,
    "difficulty_rating" DECIMAL(3,2) NOT NULL,
    
    -- Timestamps
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    
    CONSTRAINT "numeromagic_rounds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "numeromagic_rounds_score_id_fkey" FOREIGN KEY ("score_id") REFERENCES "numeromagic_scores"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ========================================
-- 3. Table des statistiques utilisateur NuméroMagic
-- ========================================
CREATE TABLE IF NOT EXISTS "numeromagic_user_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL UNIQUE,
    
    -- Stats globales
    "total_games" INTEGER NOT NULL DEFAULT 0,
    "total_score" BIGINT NOT NULL DEFAULT 0,
    "best_score" INTEGER NOT NULL DEFAULT 0,
    "average_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Performance globale
    "total_rounds" INTEGER NOT NULL DEFAULT 0,
    "total_successful" INTEGER NOT NULL DEFAULT 0,
    "global_accuracy" DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Records
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "best_combo" INTEGER NOT NULL DEFAULT 0,
    "fastest_solve_ms" INTEGER,
    
    -- Niveau et progression
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "total_experience" BIGINT NOT NULL DEFAULT 0,
    
    -- Préférences
    "favorite_mode" TEXT,
    "preferred_difficulty" TEXT,
    
    -- Timestamps
    "first_played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "numeromagic_user_stats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "numeromagic_user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ========================================
-- 4. Index pour optimiser les performances
-- ========================================

-- Index pour numeromagic_scores
CREATE INDEX IF NOT EXISTS "numeromagic_scores_user_id_idx" ON "numeromagic_scores"("user_id");
CREATE INDEX IF NOT EXISTS "numeromagic_scores_session_id_idx" ON "numeromagic_scores"("session_id");
CREATE INDEX IF NOT EXISTS "numeromagic_scores_created_at_idx" ON "numeromagic_scores"("created_at");
CREATE INDEX IF NOT EXISTS "numeromagic_scores_score_idx" ON "numeromagic_scores"("score");

-- Index pour numeromagic_rounds
CREATE INDEX IF NOT EXISTS "numeromagic_rounds_score_id_idx" ON "numeromagic_rounds"("score_id");
CREATE INDEX IF NOT EXISTS "numeromagic_rounds_round_number_idx" ON "numeromagic_rounds"("round_number");

-- Index pour numeromagic_user_stats
CREATE INDEX IF NOT EXISTS "numeromagic_user_stats_user_id_idx" ON "numeromagic_user_stats"("user_id");
CREATE INDEX IF NOT EXISTS "numeromagic_user_stats_best_score_idx" ON "numeromagic_user_stats"("best_score");

-- ========================================
-- 5. Commentaires pour documentation
-- ========================================

COMMENT ON TABLE "numeromagic_scores" IS 'Stockage des scores et métriques de jeu NuméroMagic';
COMMENT ON TABLE "numeromagic_rounds" IS 'Détails de chaque round joué dans NuméroMagic';
COMMENT ON TABLE "numeromagic_user_stats" IS 'Statistiques agrégées par utilisateur pour NuméroMagic';

COMMENT ON COLUMN "numeromagic_scores"."game_mode" IS 'Mode de jeu: CLASSIC, TIMED, CHALLENGE';
COMMENT ON COLUMN "numeromagic_scores"."difficulty_level" IS 'Niveau de difficulté: EASY, MEDIUM, HARD, EXPERT';
COMMENT ON COLUMN "numeromagic_scores"."operations_allowed" IS 'Liste des opérations autorisées: ["ADD", "SUB", "MUL", "DIV"]';
COMMENT ON COLUMN "numeromagic_scores"."cognitive_profile" IS 'Profil cognitif pour analyse BubiX';
COMMENT ON COLUMN "numeromagic_rounds"."player_solution" IS 'Étapes de la solution du joueur (JSON)';
COMMENT ON COLUMN "numeromagic_rounds"."was_perfect" IS 'True si résolu du premier coup sans aide';

