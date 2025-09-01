-- Migration pour ajouter les tables CubeMatch
-- Date: 2024-01-01

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_user_id ON cubematch_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_score ON cubematch_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_created_at ON cubematch_scores(created_at DESC);

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
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion d'une ligne de statistiques par défaut
INSERT INTO cubematch_stats (id, total_games, total_score, average_score, best_score, total_time_played, average_time_played, highest_level)
VALUES (gen_random_uuid(), 0, 0, 0, 0, 0, 0, 1)
ON CONFLICT DO NOTHING;

-- Fonction pour mettre à jour les statistiques
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
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les statistiques
DROP TRIGGER IF EXISTS trigger_update_cubematch_stats ON cubematch_scores;
CREATE TRIGGER trigger_update_cubematch_stats
    AFTER INSERT OR UPDATE OR DELETE ON cubematch_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_cubematch_stats();
