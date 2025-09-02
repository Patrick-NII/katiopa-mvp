-- Migration pour créer les tables de comptes rendus quotidiens
-- Créée le: 2024-12-19

-- Sessions enfant avec consentement email
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  child_nickname TEXT NOT NULL,
  child_age INT NOT NULL CHECK (child_age >= 3 AND child_age <= 12),
  parent_email TEXT NOT NULL,
  goals JSONB DEFAULT '{}',
  consent_email BOOLEAN NOT NULL DEFAULT true,
  email_frequency TEXT DEFAULT 'daily' CHECK (email_frequency IN ('daily', 'weekly', 'off')),
  email_time TIME DEFAULT '19:30:00',
  email_domains TEXT[] DEFAULT ARRAY['maths', 'programmation', 'playcube'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evénements d'apprentissage (granulaire)
CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  domain TEXT NOT NULL CHECK (domain IN ('maths', 'programmation', 'playcube', 'science', 'reading')),
  activity TEXT NOT NULL,
  duration_sec INT NOT NULL CHECK (duration_sec > 0),
  success_ratio NUMERIC CHECK (success_ratio >= 0 AND success_ratio <= 1),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Résultats quiz/exos (agrégé par exo)
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  module TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  attempts INT NOT NULL DEFAULT 1 CHECK (attempts > 0),
  time_sec INT NOT NULL CHECK (time_sec > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Statistiques journalières (pré-calculées par batch)
CREATE TABLE IF NOT EXISTS session_stats_daily (
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_time_min INT NOT NULL DEFAULT 0,
  kpi_assiduite NUMERIC DEFAULT 0 CHECK (kpi_assiduite >= 0 AND kpi_assiduite <= 100),
  kpi_comprehension NUMERIC DEFAULT 0 CHECK (kpi_comprehension >= 0 AND kpi_comprehension <= 100),
  kpi_progression NUMERIC DEFAULT 0 CHECK (kpi_progression >= 0 AND kpi_progression <= 100),
  sessions_count INT DEFAULT 0,
  best_module TEXT,
  needs_help TEXT,
  consecutive_days INT DEFAULT 0,
  focus_score NUMERIC DEFAULT 0 CHECK (focus_score >= 0 AND focus_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (session_id, date)
);

-- Rapports envoyés (journalisation)
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  model_used TEXT NOT NULL,
  prompt_used TEXT,
  kpis_snapshot JSONB NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_email TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Préférences de rapports par parent
CREATE TABLE IF NOT EXISTS report_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'off')),
  preferred_time TIME DEFAULT '19:30:00',
  domains TEXT[] DEFAULT ARRAY['maths', 'programmation', 'playcube'],
  include_goals BOOLEAN DEFAULT true,
  include_advice BOOLEAN DEFAULT true,
  include_stats BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_sessions_account_id ON user_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_consent_email ON user_sessions(consent_email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_email_frequency ON user_sessions(email_frequency);

CREATE INDEX IF NOT EXISTS idx_learning_events_session_id ON learning_events(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_ts ON learning_events(ts);
CREATE INDEX IF NOT EXISTS idx_learning_events_domain ON learning_events(domain);

CREATE INDEX IF NOT EXISTS idx_quiz_results_session_id ON quiz_results(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_ts ON quiz_results(ts);
CREATE INDEX IF NOT EXISTS idx_quiz_results_module ON quiz_results(module);

CREATE INDEX IF NOT EXISTS idx_session_stats_daily_session_id ON session_stats_daily(session_id);
CREATE INDEX IF NOT EXISTS idx_session_stats_daily_date ON session_stats_daily(date);

CREATE INDEX IF NOT EXISTS idx_daily_reports_session_id ON daily_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_sent_at ON daily_reports(sent_at);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_stats_daily_updated_at BEFORE UPDATE ON session_stats_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_preferences_updated_at BEFORE UPDATE ON report_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer les statistiques journalières
CREATE OR REPLACE FUNCTION calculate_daily_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    -- Supprimer les stats existantes pour la date
    DELETE FROM session_stats_daily WHERE date = target_date;
    
    -- Insérer les nouvelles stats calculées
    INSERT INTO session_stats_daily (
        session_id, date, total_time_min, kpi_assiduite, kpi_comprehension, 
        kpi_progression, sessions_count, best_module, needs_help, consecutive_days, focus_score
    )
    SELECT 
        us.id as session_id,
        target_date as date,
        COALESCE(SUM(le.duration_sec) / 60, 0) as total_time_min,
        -- KPI Assiduité: minutes actives / objectif journalier (20-30 min)
        LEAST(100, (COALESCE(SUM(le.duration_sec) / 60, 0) / 25.0) * 100) as kpi_assiduite,
        -- KPI Compréhension: moyenne des scores des quiz
        COALESCE(AVG(qr.score), 0) as kpi_comprehension,
        -- KPI Progression: basé sur les nouveaux modules débloqués
        COALESCE(
            (COUNT(DISTINCT qr.module) * 10), -- 10 points par nouveau module
            0
        ) as kpi_progression,
        -- Nombre de sessions
        COUNT(DISTINCT DATE_TRUNC('hour', le.ts)) as sessions_count,
        -- Meilleur module du jour
        (SELECT module FROM quiz_results 
         WHERE session_id = us.id 
         AND DATE(ts) = target_date 
         ORDER BY score DESC 
         LIMIT 1) as best_module,
        -- Module à renforcer
        (SELECT module FROM quiz_results 
         WHERE session_id = us.id 
         AND DATE(ts) = target_date 
         ORDER BY score ASC 
         LIMIT 1) as needs_help,
        -- Jours consécutifs
        (SELECT COUNT(*) FROM (
            SELECT DISTINCT DATE(ts) as session_date
            FROM learning_events 
            WHERE session_id = us.id 
            AND ts >= target_date - INTERVAL '7 days'
            ORDER BY session_date DESC
        ) consecutive_dates) as consecutive_days,
        -- Score de focus: temps moyen par activité
        CASE 
            WHEN COUNT(le.id) > 0 THEN 
                LEAST(100, (AVG(le.duration_sec) / 300.0) * 100) -- 5 min = 100%
            ELSE 0 
        END as focus_score
    FROM user_sessions us
    LEFT JOIN learning_events le ON us.id = le.session_id AND DATE(le.ts) = target_date
    LEFT JOIN quiz_results qr ON us.id = qr.session_id AND DATE(qr.ts) = target_date
    WHERE us.consent_email = true
    GROUP BY us.id;
END;
$$ LANGUAGE plpgsql;
