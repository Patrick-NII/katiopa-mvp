-- Migration pour créer les tables CubeMatch avec système de classement complet
-- Date: 2025-01-01

-- Table des scores CubeMatch
CREATE TABLE IF NOT EXISTS cubematch_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "UserSession"(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    level INTEGER NOT NULL CHECK (level >= 1),
    time_played_ms BIGINT NOT NULL CHECK (time_played_ms >= 0),
    operator VARCHAR(10) NOT NULL CHECK (operator IN ('ADD', 'SUB', 'MUL', 'DIV')),
    target INTEGER NOT NULL CHECK (target >= 1),
    allow_diagonals BOOLEAN NOT NULL DEFAULT false,
    grid_size_rows INTEGER NOT NULL DEFAULT 8,
    grid_size_cols INTEGER NOT NULL DEFAULT 8,
    max_size INTEGER NOT NULL DEFAULT 9,
    spawn_rate_min INTEGER NOT NULL DEFAULT 2,
    spawn_rate_max INTEGER NOT NULL DEFAULT 4,
    tick_ms INTEGER NOT NULL DEFAULT 4000,
    combo_max INTEGER NOT NULL DEFAULT 0,
    cells_cleared INTEGER NOT NULL DEFAULT 0,
    hints_used INTEGER NOT NULL DEFAULT 0,
    game_duration_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques globales (cache)
CREATE TABLE IF NOT EXISTS cubematch_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_games BIGINT NOT NULL DEFAULT 0,
    total_score BIGINT NOT NULL DEFAULT 0,
    average_score DECIMAL(10,2) NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    total_time_played BIGINT NOT NULL DEFAULT 0,
    average_time_played DECIMAL(10,2) NOT NULL DEFAULT 0,
    highest_level INTEGER NOT NULL DEFAULT 1,
    total_players INTEGER NOT NULL DEFAULT 0,
    average_level DECIMAL(5,2) NOT NULL DEFAULT 1,
    most_used_operator VARCHAR(10) NOT NULL DEFAULT 'ADD',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques par utilisateur
CREATE TABLE IF NOT EXISTS cubematch_user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "UserSession"(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    total_games INTEGER NOT NULL DEFAULT 0,
    total_score BIGINT NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    average_score DECIMAL(10,2) NOT NULL DEFAULT 0,
    highest_level INTEGER NOT NULL DEFAULT 1,
    total_time_played BIGINT NOT NULL DEFAULT 0,
    average_time_played DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_combo_max INTEGER NOT NULL DEFAULT 0,
    total_cells_cleared INTEGER NOT NULL DEFAULT 0,
    total_hints_used INTEGER NOT NULL DEFAULT 0,
    favorite_operator VARCHAR(10) NOT NULL DEFAULT 'ADD',
    last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_user_id ON cubematch_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_score ON cubematch_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_created_at ON cubematch_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_level ON cubematch_scores(level DESC);
CREATE INDEX IF NOT EXISTS idx_cubematch_user_stats_user_id ON cubematch_user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_cubematch_user_stats_best_score ON cubematch_user_stats(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_cubematch_user_stats_total_score ON cubematch_user_stats(total_score DESC);

-- Insertion d'une ligne de statistiques par défaut
INSERT INTO cubematch_stats (id, total_games, total_score, average_score, best_score, total_time_played, average_time_played, highest_level, total_players, average_level, most_used_operator)
VALUES (gen_random_uuid(), 0, 0, 0, 0, 0, 0, 1, 0, 1, 'ADD')
ON CONFLICT DO NOTHING;

-- Fonction pour mettre à jour les statistiques globales
CREATE OR REPLACE FUNCTION update_cubematch_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les statistiques globales
    UPDATE cubematch_stats SET
        total_games = (SELECT COUNT(*) FROM cubematch_scores),
        total_score = (SELECT COALESCE(SUM(score), 0) FROM cubematch_scores),
        average_score = (SELECT COALESCE(AVG(score), 0) FROM cubematch_scores),
        best_score = (SELECT COALESCE(MAX(score), 0) FROM cubematch_scores),
        total_time_played = (SELECT COALESCE(SUM(time_played_ms), 0) FROM cubematch_scores),
        average_time_played = (SELECT COALESCE(AVG(time_played_ms), 0) FROM cubematch_scores),
        highest_level = (SELECT COALESCE(MAX(level), 1) FROM cubematch_scores),
        total_players = (SELECT COUNT(DISTINCT user_id) FROM cubematch_scores),
        average_level = (SELECT COALESCE(AVG(level), 1) FROM cubematch_scores),
        most_used_operator = (
            SELECT operator 
            FROM (
                SELECT operator, COUNT(*) as count
                FROM cubematch_scores
                GROUP BY operator
                ORDER BY count DESC
                LIMIT 1
            ) op
        ),
        last_updated = NOW()
    WHERE id = (SELECT id FROM cubematch_stats LIMIT 1);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les statistiques automatiquement
CREATE TRIGGER cubematch_scores_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cubematch_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_cubematch_stats();

-- Fonction pour mettre à jour les statistiques utilisateur
CREATE OR REPLACE FUNCTION update_cubematch_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Insérer ou mettre à jour les statistiques utilisateur
    INSERT INTO cubematch_user_stats (
        user_id, username, total_games, total_score, best_score, average_score,
        highest_level, total_time_played, average_time_played, total_combo_max,
        total_cells_cleared, total_hints_used, favorite_operator, last_played, updated_at
    )
    VALUES (
        NEW.user_id, NEW.username,
        (SELECT COUNT(*) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT COALESCE(SUM(score), 0) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT COALESCE(MAX(score), 0) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT COALESCE(AVG(score), 0) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT COALESCE(MAX(level), 1) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT COALESCE(SUM(time_played_ms), 0) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT COALESCE(AVG(time_played_ms), 0) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT COALESCE(SUM(combo_max), 0) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT COALESCE(SUM(cells_cleared), 0) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT COALESCE(SUM(hints_used), 0) FROM cubematch_scores WHERE user_id = NEW.user_id),
        (SELECT operator FROM (
            SELECT operator, COUNT(*) as count
            FROM cubematch_scores
            WHERE user_id = NEW.user_id
            GROUP BY operator
            ORDER BY count DESC
            LIMIT 1
        ) op),
        NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_games = EXCLUDED.total_games,
        total_score = EXCLUDED.total_score,
        best_score = EXCLUDED.best_score,
        average_score = EXCLUDED.average_score,
        highest_level = EXCLUDED.highest_level,
        total_time_played = EXCLUDED.total_time_played,
        average_time_played = EXCLUDED.average_time_played,
        total_combo_max = EXCLUDED.total_combo_max,
        total_cells_cleared = EXCLUDED.total_cells_cleared,
        total_hints_used = EXCLUDED.total_hints_used,
        favorite_operator = EXCLUDED.favorite_operator,
        last_played = EXCLUDED.last_played,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les statistiques utilisateur automatiquement
CREATE TRIGGER cubematch_scores_user_stats_trigger
    AFTER INSERT OR UPDATE ON cubematch_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_cubematch_user_stats();
