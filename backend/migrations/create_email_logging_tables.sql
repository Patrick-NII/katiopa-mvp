-- Migration pour créer les tables de logging des emails
-- Exécuté le: $(date)

-- Table des logs d'emails envoyés
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    email_type VARCHAR(20) NOT NULL CHECK (email_type IN ('HELLO', 'SUPPORT', 'NOREPLY')),
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'BOUNCED')),
    message_id VARCHAR(255),
    smtp_response TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des emails entrants
CREATE TABLE IF NOT EXISTS incoming_emails (
    id SERIAL PRIMARY KEY,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    headers JSONB,
    message_id VARCHAR(255),
    email_type VARCHAR(20) DEFAULT 'SUPPORT' CHECK (email_type IN ('SUPPORT', 'HELLO', 'GENERAL')),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    assigned_to VARCHAR(255),
    ticket_id VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des templates d'emails
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    email_type VARCHAR(20) NOT NULL CHECK (email_type IN ('HELLO', 'SUPPORT', 'NOREPLY')),
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des statistiques d'emails
CREATE TABLE IF NOT EXISTS email_statistics (
    id SERIAL PRIMARY KEY,
    email_type VARCHAR(20) NOT NULL CHECK (email_type IN ('HELLO', 'SUPPORT', 'NOREPLY')),
    date DATE NOT NULL,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email_type, date)
);

-- Table des bounces
CREATE TABLE IF NOT EXISTS email_bounces (
    id SERIAL PRIMARY KEY,
    email_log_id INTEGER REFERENCES email_logs(id) ON DELETE SET NULL,
    email_address VARCHAR(255) NOT NULL,
    bounce_type VARCHAR(20) NOT NULL CHECK (bounce_type IN ('HARD', 'SOFT', 'COMPLAINT')),
    reason TEXT,
    smtp_response TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);

CREATE INDEX IF NOT EXISTS idx_incoming_emails_status ON incoming_emails(status);
CREATE INDEX IF NOT EXISTS idx_incoming_emails_email_type ON incoming_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_incoming_emails_created_at ON incoming_emails(created_at);

CREATE INDEX IF NOT EXISTS idx_email_statistics_date ON email_statistics(date);
CREATE INDEX IF NOT EXISTS idx_email_statistics_email_type ON email_statistics(email_type);

CREATE INDEX IF NOT EXISTS idx_email_bounces_email_address ON email_bounces(email_address);
CREATE INDEX IF NOT EXISTS idx_email_bounces_received_at ON email_bounces(received_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incoming_emails_updated_at BEFORE UPDATE ON incoming_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_statistics_updated_at BEFORE UPDATE ON email_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insérer des templates par défaut
INSERT INTO email_templates (name, email_type, subject_template, html_template, text_template) VALUES
('welcome_email', 'NOREPLY', 'Bienvenue sur CubeAI - Votre compte a été créé avec succès', 
'<h1>Bienvenue sur CubeAI !</h1><p>Votre compte a été créé avec succès.</p>',
'Bienvenue sur CubeAI ! Votre compte a été créé avec succès.'),
('password_reset', 'NOREPLY', 'CubeAI - Réinitialisation de votre mot de passe',
'<h1>Réinitialisation de mot de passe</h1><p>Cliquez sur le lien pour réinitialiser votre mot de passe.</p>',
'Réinitialisation de mot de passe. Cliquez sur le lien pour réinitialiser votre mot de passe.'),
('newsletter_template', 'HELLO', 'CubeAI - Newsletter - {{subject}}',
'<h1>CubeAI Newsletter</h1><p>{{content}}</p>',
'CubeAI Newsletter - {{content}}')
ON CONFLICT (name) DO NOTHING;

-- Insérer des statistiques initiales pour aujourd'hui
INSERT INTO email_statistics (email_type, date, sent_count, delivered_count, failed_count, bounced_count)
SELECT 
    email_type,
    CURRENT_DATE,
    0,
    0,
    0,
    0
FROM (VALUES ('HELLO'), ('SUPPORT'), ('NOREPLY')) AS t(email_type)
ON CONFLICT (email_type, date) DO NOTHING;
