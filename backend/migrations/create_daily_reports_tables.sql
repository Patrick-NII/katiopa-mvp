-- Migration pour créer les tables des rapports quotidiens
-- Exécuté le: $(date)

-- Table des sessions utilisateur pour les rapports quotidiens
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    account_id VARCHAR(255) NOT NULL,
    child_nickname VARCHAR(255) NOT NULL,
    child_age INTEGER NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    goals JSONB DEFAULT '{}',
    consent_email BOOLEAN DEFAULT TRUE,
    email_frequency VARCHAR(20) DEFAULT 'daily',
    email_time TIME DEFAULT '19:30:00',
    email_domains TEXT[] DEFAULT ARRAY['maths', 'programmation', 'playcube'],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des événements d'apprentissage
CREATE TABLE IF NOT EXISTS learning_events (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    domain VARCHAR(100) NOT NULL,
    activity VARCHAR(255) NOT NULL,
    duration_sec INTEGER NOT NULL,
    success_ratio NUMERIC(5,4),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
);

-- Table des résultats de quiz
CREATE TABLE IF NOT EXISTS quiz_results (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    module VARCHAR(255) NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    attempts INTEGER DEFAULT 1,
    time_sec INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
);

-- Table des statistiques journalières
CREATE TABLE IF NOT EXISTS session_stats_daily (
    session_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    total_time_min INTEGER DEFAULT 0,
    kpi_assiduite NUMERIC(5,2) DEFAULT 0,
    kpi_comprehension NUMERIC(5,2) DEFAULT 0,
    kpi_progression NUMERIC(5,2) DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    best_module VARCHAR(255),
    needs_help VARCHAR(255),
    consecutive_days INTEGER DEFAULT 0,
    focus_score NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, date),
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
);

-- Table des rapports quotidiens envoyés
CREATE TABLE IF NOT EXISTS daily_reports (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    prompt_used TEXT,
    kpis_snapshot JSONB NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE
);

-- Table des préférences de rapports
CREATE TABLE IF NOT EXISTS report_preferences (
    id VARCHAR(255) PRIMARY KEY,
    account_id VARCHAR(255) UNIQUE NOT NULL,
    frequency VARCHAR(20) DEFAULT 'daily',
    preferred_time TIME DEFAULT '19:30:00',
    domains TEXT[] DEFAULT ARRAY['maths', 'programmation', 'playcube'],
    include_goals BOOLEAN DEFAULT TRUE,
    include_advice BOOLEAN DEFAULT TRUE,
    include_stats BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_sessions_account_id ON user_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_parent_email ON user_sessions(parent_email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_consent_email ON user_sessions(consent_email);

CREATE INDEX IF NOT EXISTS idx_learning_events_session_id ON learning_events(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_ts ON learning_events(ts);
CREATE INDEX IF NOT EXISTS idx_learning_events_domain ON learning_events(domain);

CREATE INDEX IF NOT EXISTS idx_quiz_results_session_id ON quiz_results(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_ts ON quiz_results(ts);
CREATE INDEX IF NOT EXISTS idx_quiz_results_module ON quiz_results(module);

CREATE INDEX IF NOT EXISTS idx_session_stats_daily_date ON session_stats_daily(date);
CREATE INDEX IF NOT EXISTS idx_session_stats_daily_session_id ON session_stats_daily(session_id);

CREATE INDEX IF NOT EXISTS idx_daily_reports_session_id ON daily_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_parent_email ON daily_reports(parent_email);

CREATE INDEX IF NOT EXISTS idx_report_preferences_account_id ON report_preferences(account_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_stats_daily_updated_at BEFORE UPDATE ON session_stats_daily FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_preferences_updated_at BEFORE UPDATE ON report_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer les statistiques journalières
CREATE OR REPLACE FUNCTION calculate_daily_stats(p_session_id VARCHAR(255), p_date DATE)
RETURNS VOID AS $$
DECLARE
    v_total_time_min INTEGER := 0;
    v_kpi_assiduite NUMERIC(5,2) := 0;
    v_kpi_comprehension NUMERIC(5,2) := 0;
    v_kpi_progression NUMERIC(5,2) := 0;
    v_sessions_count INTEGER := 0;
    v_best_module VARCHAR(255) := NULL;
    v_needs_help VARCHAR(255) := NULL;
    v_consecutive_days INTEGER := 0;
    v_focus_score NUMERIC(5,2) := 0;
    v_avg_score NUMERIC(5,2) := 0;
    v_total_events INTEGER := 0;
    v_successful_events INTEGER := 0;
BEGIN
    -- Calculer le temps total
    SELECT COALESCE(SUM(duration_sec) / 60, 0)
    INTO v_total_time_min
    FROM learning_events
    WHERE session_id = p_session_id 
    AND DATE(ts) = p_date;

    -- Calculer le nombre de sessions
    SELECT COUNT(DISTINCT DATE_TRUNC('hour', ts))
    INTO v_sessions_count
    FROM learning_events
    WHERE session_id = p_session_id 
    AND DATE(ts) = p_date;

    -- Calculer la compréhension (moyenne des scores de quiz)
    SELECT COALESCE(AVG(score), 0)
    INTO v_kpi_comprehension
    FROM quiz_results
    WHERE session_id = p_session_id 
    AND DATE(ts) = p_date;

    -- Calculer le ratio de réussite des événements
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN success_ratio >= 0.8 THEN 1 END)
    INTO v_total_events, v_successful_events
    FROM learning_events
    WHERE session_id = p_session_id 
    AND DATE(ts) = p_date
    AND success_ratio IS NOT NULL;

    IF v_total_events > 0 THEN
        v_kpi_assiduite := (v_successful_events::NUMERIC / v_total_events) * 100;
    END IF;

    -- Trouver le meilleur module
    SELECT module
    INTO v_best_module
    FROM quiz_results
    WHERE session_id = p_session_id 
    AND DATE(ts) = p_date
    ORDER BY score DESC
    LIMIT 1;

    -- Calculer les jours consécutifs
    SELECT COALESCE(MAX(consecutive_days), 0) + 1
    INTO v_consecutive_days
    FROM session_stats_daily
    WHERE session_id = p_session_id
    AND date < p_date
    ORDER BY date DESC
    LIMIT 1;

    -- Calculer le score de focus (temps moyen par activité)
    SELECT COALESCE(AVG(duration_sec), 0)
    INTO v_focus_score
    FROM learning_events
    WHERE session_id = p_session_id 
    AND DATE(ts) = p_date;

    -- Calculer la progression (basée sur l'amélioration des scores)
    SELECT COALESCE(
        (AVG(score) - LAG(AVG(score)) OVER (ORDER BY DATE(ts))) / NULLIF(LAG(AVG(score)) OVER (ORDER BY DATE(ts)), 0) * 100, 
        0
    )
    INTO v_kpi_progression
    FROM quiz_results
    WHERE session_id = p_session_id 
    AND DATE(ts) BETWEEN p_date - INTERVAL '7 days' AND p_date
    GROUP BY DATE(ts)
    ORDER BY DATE(ts) DESC
    LIMIT 1;

    -- Insérer ou mettre à jour les statistiques
    INSERT INTO session_stats_daily (
        session_id, date, total_time_min, kpi_assiduite, kpi_comprehension, 
        kpi_progression, sessions_count, best_module, needs_help, 
        consecutive_days, focus_score
    ) VALUES (
        p_session_id, p_date, v_total_time_min, v_kpi_assiduite, v_kpi_comprehension,
        v_kpi_progression, v_sessions_count, v_best_module, v_needs_help,
        v_consecutive_days, v_focus_score
    )
    ON CONFLICT (session_id, date) DO UPDATE SET
        total_time_min = EXCLUDED.total_time_min,
        kpi_assiduite = EXCLUDED.kpi_assiduite,
        kpi_comprehension = EXCLUDED.kpi_comprehension,
        kpi_progression = EXCLUDED.kpi_progression,
        sessions_count = EXCLUDED.sessions_count,
        best_module = EXCLUDED.best_module,
        needs_help = EXCLUDED.needs_help,
        consecutive_days = EXCLUDED.consecutive_days,
        focus_score = EXCLUDED.focus_score,
        updated_at = CURRENT_TIMESTAMP;

END;
$$ LANGUAGE plpgsql;
