-- Migration pour ajouter les champs de métriques avancées du nouveau système CubeMatch

-- Ajout des champs pour les métriques avancées dans cubematch_scores
ALTER TABLE cubematch_scores 
ADD COLUMN IF NOT EXISTS initial_difficulty DECIMAL(5, 2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS final_difficulty DECIMAL(5, 2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS average_difficulty DECIMAL(5, 2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS difficulty_progression JSON,
ADD COLUMN IF NOT EXISTS flow_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score_v2 INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cognitive_profile JSON,
ADD COLUMN IF NOT EXISTS operator_distribution JSON,
ADD COLUMN IF NOT EXISTS operator_accuracy JSON,
ADD COLUMN IF NOT EXISTS bubix_metrics JSON,
ADD COLUMN IF NOT EXISTS recommendations JSON;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_session_id ON cubematch_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_user_difficulty ON cubematch_scores(user_id, final_difficulty);
CREATE INDEX IF NOT EXISTS idx_cubematch_scores_created_at ON cubematch_scores(created_at DESC);

-- Commentaires pour documentation
COMMENT ON COLUMN cubematch_scores.initial_difficulty IS 'Difficulté de départ (0.8-3.5)';
COMMENT ON COLUMN cubematch_scores.final_difficulty IS 'Difficulté finale atteinte (0.8-3.5)';
COMMENT ON COLUMN cubematch_scores.average_difficulty IS 'Difficulté moyenne pendant la session';
COMMENT ON COLUMN cubematch_scores.difficulty_progression IS 'Evolution de la difficulté round par round';
COMMENT ON COLUMN cubematch_scores.flow_score IS 'Score d''état de flow (0-100)';
COMMENT ON COLUMN cubematch_scores.engagement_score_v2 IS 'Score d''engagement v2 (0-100)';
COMMENT ON COLUMN cubematch_scores.cognitive_profile IS 'Profil cognitif (speed vs accuracy, recovery, adaptability, persistence)';
COMMENT ON COLUMN cubematch_scores.operator_distribution IS 'Distribution des opérateurs utilisés';
COMMENT ON COLUMN cubematch_scores.operator_accuracy IS 'Précision par opérateur';
COMMENT ON COLUMN cubematch_scores.bubix_metrics IS 'Métriques formatées pour BubiX';
COMMENT ON COLUMN cubematch_scores.recommendations IS 'Recommandations personnalisées générées';


