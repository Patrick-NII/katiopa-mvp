-- Migration pour créer les tables de logging des emails
-- Créée le: 2024-12-19

-- Table principale pour les emails sortants
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    email_type VARCHAR(20) NOT NULL CHECK (email_type IN ('hello', 'support', 'noreply')),
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    message_id VARCHAR(255),
    smtp_response TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les emails entrants (support, contact, etc.)
CREATE TABLE IF NOT EXISTS incoming_emails (
    id SERIAL PRIMARY KEY,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    headers JSONB,
    message_id VARCHAR(255),
    email_type VARCHAR(20) DEFAULT 'support' CHECK (email_type IN ('support', 'hello', 'general')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'resolved', 'closed')),
    assigned_to INTEGER REFERENCES users(id),
    ticket_id VARCHAR(50),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les templates d'emails
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    email_type VARCHAR(20) NOT NULL CHECK (email_type IN ('hello', 'support', 'noreply')),
    subject_template VARCHAR(500) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les statistiques d'emails
CREATE TABLE IF NOT EXISTS email_statistics (
    id SERIAL PRIMARY KEY,
    email_type VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email_type, date)
);

-- Table pour les bounces et erreurs
CREATE TABLE IF NOT EXISTS email_bounces (
    id SERIAL PRIMARY KEY,
    email_log_id INTEGER REFERENCES email_logs(id),
    email_address VARCHAR(255) NOT NULL,
    bounce_type VARCHAR(20) NOT NULL CHECK (bounce_type IN ('hard', 'soft', 'complaint')),
    reason TEXT,
    smtp_response TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);

CREATE INDEX IF NOT EXISTS idx_incoming_emails_status ON incoming_emails(status);
CREATE INDEX IF NOT EXISTS idx_incoming_emails_email_type ON incoming_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_incoming_emails_created_at ON incoming_emails(created_at);
CREATE INDEX IF NOT EXISTS idx_incoming_emails_from_email ON incoming_emails(from_email);

CREATE INDEX IF NOT EXISTS idx_email_templates_email_type ON email_templates(email_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_statistics_date ON email_statistics(date);
CREATE INDEX IF NOT EXISTS idx_email_statistics_email_type ON email_statistics(email_type);

CREATE INDEX IF NOT EXISTS idx_email_bounces_email_address ON email_bounces(email_address);
CREATE INDEX IF NOT EXISTS idx_email_bounces_bounce_type ON email_bounces(bounce_type);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incoming_emails_updated_at BEFORE UPDATE ON incoming_emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_statistics_updated_at BEFORE UPDATE ON email_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des templates par défaut
INSERT INTO email_templates (name, email_type, subject_template, html_template, text_template, variables) VALUES
('welcome', 'hello', 'Bienvenue chez CubeAI ! Votre compte a été créé ({{registrationId}})', 
'<!DOCTYPE html><html><body><h1>Bienvenue {{toName}} !</h1><p>Votre compte a été créé avec succès.</p></body></html>',
'Bienvenue {{toName}} ! Votre compte a été créé avec succès.',
'{"toName": "string", "registrationId": "string", "subscriptionType": "string"}'),

('password_reset', 'noreply', 'Réinitialisation de mot de passe',
'<!DOCTYPE html><html><body><h1>Réinitialisation du mot de passe</h1><p>Cliquez sur le lien pour réinitialiser votre mot de passe.</p></body></html>',
'Réinitialisation du mot de passe. Cliquez sur le lien pour réinitialiser votre mot de passe.',
'{"toName": "string", "resetLink": "string"}'),

('support_response', 'support', 'Support CubeAI - {{ticketId}}',
'<!DOCTYPE html><html><body><h1>Support CubeAI</h1><p>{{message}}</p></body></html>',
'Support CubeAI. {{message}}',
'{"toName": "string", "message": "string", "ticketId": "string"}'),

('billing_invoice', 'noreply', 'Facture CubeAI - {{invoiceNumber}}',
'<!DOCTYPE html><html><body><h1>Facture CubeAI</h1><p>Votre facture est prête.</p></body></html>',
'Facture CubeAI. Votre facture est prête.',
'{"toName": "string", "invoiceNumber": "string", "amount": "string", "dueDate": "string"}')
ON CONFLICT (name) DO NOTHING;
