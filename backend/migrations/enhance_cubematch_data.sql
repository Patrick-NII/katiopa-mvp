-- Migration pour étendre les données CubeMatch avec paramètres détaillés pour l'IA
-- Date: 2025-01-04

-- Ajouter de nouveaux champs à la table cubematch_scores pour plus de détails
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) DEFAULT 'classic' CHECK (game_mode IN ('classic', 'timed', 'cascade', 'challenge'));
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(10) DEFAULT 'normal' CHECK (difficulty_level IN ('easy', 'normal', 'hard', 'expert'));

-- Statistiques de performance détaillées
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS total_moves INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS successful_moves INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS failed_moves INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS accuracy_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS average_move_time_ms DECIMAL(10,2) DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS fastest_move_time_ms INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS slowest_move_time_ms INTEGER DEFAULT 0;

-- Statistiques par opération
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS additions_count INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS subtractions_count INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS multiplications_count INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS divisions_count INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS additions_score INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS subtractions_score INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS multiplications_score INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS divisions_score INTEGER DEFAULT 0;

-- Statistiques de grille
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS grid_completion_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS max_consecutive_hits INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS max_consecutive_misses INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS longest_combo_chain INTEGER DEFAULT 0;

-- Paramètres de difficulté utilisés
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS target_numbers_used TEXT DEFAULT '[]';
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS operator_sequence TEXT DEFAULT '[]';

-- Métriques de temps détaillées
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS time_spent_on_additions_ms BIGINT DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS time_spent_on_subtractions_ms BIGINT DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS time_spent_on_multiplications_ms BIGINT DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS time_spent_on_divisions_ms BIGINT DEFAULT 0;

-- Statistiques de session
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS session_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS session_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS breaks_taken INTEGER DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS total_break_time_ms BIGINT DEFAULT 0;

-- Métriques d'engagement
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS focus_time_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS difficulty_adjustments INTEGER DEFAULT 0;

-- Paramètres de personnalisation
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS theme_used VARCHAR(20) DEFAULT 'classic';
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS assist_enabled BOOLEAN DEFAULT true;
ALTER TABLE cubematch_scores ADD COLUMN IF NOT EXISTS hints_enabled BOOLEAN DEFAULT true;

-- Table pour les statistiques détaillées par opération
CREATE TABLE IF NOT EXISTS cubematch_operator_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "UserSession"(id) ON DELETE CASCADE,
    operator VARCHAR(10) NOT NULL CHECK (operator IN ('ADD', 'SUB', 'MUL', 'DIV')),
    
    -- Statistiques globales par opération
    total_games INTEGER DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    average_score DECIMAL(10,2) DEFAULT 0,
    total_time_played_ms BIGINT DEFAULT 0,
    average_time_per_game_ms DECIMAL(10,2) DEFAULT 0,
    
    -- Statistiques de performance
    total_moves INTEGER DEFAULT 0,
    successful_moves INTEGER DEFAULT 0,
    failed_moves INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0,
    average_move_time_ms DECIMAL(10,2) DEFAULT 0,
    
    -- Statistiques de difficulté
    average_level DECIMAL(5,2) DEFAULT 1,
    highest_level INTEGER DEFAULT 1,
    favorite_target_numbers TEXT DEFAULT '[]', -- JSON array
    least_favorite_target_numbers TEXT DEFAULT '[]', -- JSON array
    
    -- Métriques de progression
    improvement_rate DECIMAL(5,2) DEFAULT 0,
    last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, operator)
);

-- Table pour les sessions de jeu détaillées
CREATE TABLE IF NOT EXISTS cubematch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "UserSession"(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    total_games_played INTEGER DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    total_time_played_ms BIGINT DEFAULT 0,
    
    -- Métriques de session
    average_games_per_hour DECIMAL(10,2) DEFAULT 0,
    longest_game_duration_ms INTEGER DEFAULT 0,
    shortest_game_duration_ms INTEGER DEFAULT 0,
    
    -- Patterns de jeu
    preferred_operators TEXT DEFAULT '[]', -- JSON array
    preferred_grid_sizes TEXT DEFAULT '[]', -- JSON array
    preferred_target_numbers TEXT DEFAULT '[]', -- JSON array
    
    -- Métriques d'engagement
    engagement_level VARCHAR(20) DEFAULT 'medium' CHECK (engagement_level IN ('low', 'medium', 'high', 'very_high')),
    focus_breaks INTEGER DEFAULT 0,
    total_break_time_ms BIGINT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les insights et recommandations IA
CREATE TABLE IF NOT EXISTS cubematch_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "UserSession"(id) ON DELETE CASCADE,
    
    -- Analyse de performance
    strength_areas TEXT DEFAULT '[]', -- JSON array des forces
    improvement_areas TEXT DEFAULT '[]', -- JSON array des axes d'amélioration
    learning_patterns TEXT DEFAULT '[]', -- JSON array des patterns d'apprentissage
    
    -- Recommandations personnalisées
    recommended_operators TEXT DEFAULT '[]', -- JSON array
    recommended_target_numbers TEXT DEFAULT '[]', -- JSON array
    recommended_grid_sizes TEXT DEFAULT '[]', -- JSON array
    recommended_difficulty VARCHAR(10) DEFAULT 'normal',
    
    -- Métriques de progression
    progress_score DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    challenge_readiness DECIMAL(5,2) DEFAULT 0,
    
    -- Insights temporels
    best_playing_hours TEXT DEFAULT '[]', -- JSON array des heures optimales
    optimal_session_duration_ms BIGINT DEFAULT 0,
    recommended_break_frequency INTEGER DEFAULT 0,
    
    -- Dernière analyse
    last_analysis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Index pour optimiser les nouvelles requêtes
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_operator ON cubematch_scores(operator);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_game_mode ON cubematch_scores(game_mode);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_difficulty ON cubematch_scores(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_accuracy ON cubematch_scores(accuracy_rate DESC);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_session_start ON cubematch_scores(session_start_time);
CREATE INDEX IF NOT EXISTS idx_cubematch_operator_stats_user_operator ON cubematch_operator_stats(user_id, operator);
CREATE INDEX IF NOT EXISTS idx_cubematch_sessions_user_start ON cubematch_sessions(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_cubematch_insights_user ON cubematch_insights(user_id);

-- Fonction pour calculer les statistiques par opération
CREATE OR REPLACE FUNCTION update_cubematch_operator_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les statistiques par opération
    INSERT INTO cubematch_operator_stats (
        user_id, operator, total_games, total_score, best_score, average_score,
        total_time_played_ms, average_time_per_game_ms, total_moves, successful_moves,
        failed_moves, accuracy_rate, average_move_time_ms, average_level, highest_level,
        last_played, updated_at
    )
    VALUES (
        NEW.user_id, NEW.operator,
        (SELECT COUNT(*) FROM cubematch_scores WHERE user_id = NEW.user_id AND operator = NEW.operator),
        (SELECT COALESCE(SUM(score), 0) FROM cubematch_scores WHERE user_id = NEW.user_id AND operator = NEW.operator),
        (SELECT COALESCE(MAX(score), 0) FROM cubematch_scores WHERE user_id = NEW.user_id AND operator = NEW.operator),
        (SELECT COALESCE(AVG(score), 0) FROM cubematch_scores WHERE user_id = NEW.user_id AND operator = NEW.operator),
        (SELECT COALESCE(SUM(time_played_ms), 0) FROM cubematch_scores WHERE user_id = NEW.user_id AND operator = NEW.operator),
        (SELECT COALESCE(AVG(time_played_ms), 0) FROM cubematch_scores WHERE user_id = NEW.user_id AND operator = NEW.operator),
        COALESCE(NEW.total_moves, 0),
        COALESCE(NEW.successful_moves, 0),
        COALESCE(NEW.failed_moves, 0),
        CASE 
            WHEN COALESCE(NEW.total_moves, 0) > 0 
            THEN (COALESCE(NEW.successful_moves, 0)::DECIMAL / COALESCE(NEW.total_moves, 0)::DECIMAL) * 100
            ELSE 0 
        END,
        COALESCE(NEW.average_move_time_ms, 0),
        (SELECT COALESCE(AVG(level), 1) FROM cubematch_scores WHERE user_id = NEW.user_id AND operator = NEW.operator),
        (SELECT COALESCE(MAX(level), 1) FROM cubematch_scores WHERE user_id = NEW.user_id AND operator = NEW.operator),
        NOW(), NOW()
    )
    ON CONFLICT (user_id, operator) DO UPDATE SET
        total_games = EXCLUDED.total_games,
        total_score = EXCLUDED.total_score,
        best_score = EXCLUDED.best_score,
        average_score = EXCLUDED.average_score,
        total_time_played_ms = EXCLUDED.total_time_played_ms,
        average_time_per_game_ms = EXCLUDED.average_time_per_game_ms,
        total_moves = EXCLUDED.total_moves,
        successful_moves = EXCLUDED.successful_moves,
        failed_moves = EXCLUDED.failed_moves,
        accuracy_rate = EXCLUDED.accuracy_rate,
        average_move_time_ms = EXCLUDED.average_move_time_ms,
        average_level = EXCLUDED.average_level,
        highest_level = EXCLUDED.highest_level,
        last_played = EXCLUDED.last_played,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les statistiques par opération
CREATE TRIGGER cubematch_scores_operator_stats_trigger
    AFTER INSERT OR UPDATE ON cubematch_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_cubematch_operator_stats();

-- Fonction pour générer des insights automatiques
CREATE OR REPLACE FUNCTION generate_cubematch_insights(user_id_param TEXT)
RETURNS VOID AS $$
DECLARE
    strength_areas JSON;
    improvement_areas JSON;
    recommended_operators JSON;
    recommended_targets JSON;
    progress_score DECIMAL;
    consistency_score DECIMAL;
BEGIN
    -- Analyser les forces (opérateurs avec les meilleurs scores)
    SELECT json_agg(operator ORDER BY average_score DESC)
    INTO strength_areas
    FROM cubematch_operator_stats 
    WHERE user_id = user_id_param AND average_score > 50;
    
    -- Analyser les axes d'amélioration (opérateurs avec les scores les plus bas)
    SELECT json_agg(operator ORDER BY average_score ASC)
    INTO improvement_areas
    FROM cubematch_operator_stats 
    WHERE user_id = user_id_param AND average_score < 50;
    
    -- Recommandations d'opérateurs à pratiquer
    SELECT json_agg(operator ORDER BY accuracy_rate ASC)
    INTO recommended_operators
    FROM cubematch_operator_stats 
    WHERE user_id = user_id_param AND accuracy_rate < 80;
    
    -- Calculer le score de progression
    SELECT AVG(improvement_rate)
    INTO progress_score
    FROM cubematch_operator_stats 
    WHERE user_id = user_id_param;
    
    -- Calculer le score de consistance
    SELECT AVG(accuracy_rate)
    INTO consistency_score
    FROM cubematch_operator_stats 
    WHERE user_id = user_id_param;
    
    -- Insérer ou mettre à jour les insights
    INSERT INTO cubematch_insights (
        user_id, strength_areas, improvement_areas, recommended_operators,
        progress_score, consistency_score, last_analysis, updated_at
    )
    VALUES (
        user_id_param, 
        COALESCE(strength_areas, '[]'::json),
        COALESCE(improvement_areas, '[]'::json),
        COALESCE(recommended_operators, '[]'::json),
        COALESCE(progress_score, 0),
        COALESCE(consistency_score, 0),
        NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        strength_areas = EXCLUDED.strength_areas,
        improvement_areas = EXCLUDED.improvement_areas,
        recommended_operators = EXCLUDED.recommended_operators,
        progress_score = EXCLUDED.progress_score,
        consistency_score = EXCLUDED.consistency_score,
        last_analysis = EXCLUDED.last_analysis,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;
