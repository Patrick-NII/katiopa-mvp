# Système de Logging des Emails CubeAI

## 📧 Vue d'Ensemble

Le système de logging des emails CubeAI permet de tracer tous les emails entrants et sortants avec un système complet de gestion, statistiques et retry automatique.

## 🗄️ Tables de Base de Données

### 1. **email_logs** - Logs des Emails Sortants
```sql
CREATE TABLE email_logs (
    id SERIAL PRIMARY KEY,
    email_type VARCHAR(20) NOT NULL, -- 'hello', 'support', 'noreply'
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
    message_id VARCHAR(255),
    smtp_response TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. **incoming_emails** - Emails Entrants
```sql
CREATE TABLE incoming_emails (
    id SERIAL PRIMARY KEY,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    headers JSONB,
    message_id VARCHAR(255),
    email_type VARCHAR(20) DEFAULT 'support', -- 'support', 'hello', 'general'
    priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'assigned', 'in_progress', 'resolved', 'closed'
    assigned_to VARCHAR(255) REFERENCES users(id),
    ticket_id VARCHAR(50),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **email_templates** - Templates d'Emails
```sql
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    email_type VARCHAR(20) NOT NULL,
    subject_template VARCHAR(500) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. **email_statistics** - Statistiques
```sql
CREATE TABLE email_statistics (
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
```

### 5. **email_bounces** - Bounces et Erreurs
```sql
CREATE TABLE email_bounces (
    id SERIAL PRIMARY KEY,
    email_log_id INTEGER REFERENCES email_logs(id),
    email_address VARCHAR(255) NOT NULL,
    bounce_type VARCHAR(20) NOT NULL, -- 'hard', 'soft', 'complaint'
    reason TEXT,
    smtp_response TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Services

### EmailLoggingService

Service principal pour la gestion des emails avec logging automatique.

```typescript
import { EmailLoggingService } from '../services/emailLoggingService';

// Envoyer un email avec logging
const result = await EmailLoggingService.sendAndLogEmail('hello', {
  to: 'user@example.com',
  subject: 'Bienvenue !',
  html: '<h1>Bienvenue</h1>'
});

// Enregistrer un email entrant
await EmailLoggingService.logIncomingEmail({
  fromEmail: 'user@example.com',
  toEmail: 'support@cube-ai.fr',
  subject: 'Problème technique',
  body: 'Bonjour, j\'ai un problème...',
  emailType: 'SUPPORT',
  priority: 'HIGH'
});

// Enregistrer un bounce
await EmailLoggingService.logEmailBounce({
  emailAddress: 'invalid@example.com',
  bounceType: 'HARD',
  reason: 'Adresse email inexistante'
});
```

### EmailService

Service de haut niveau pour l'envoi d'emails typés.

```typescript
import { EmailService } from '../services/emailService';

// Email de bienvenue (utilise hello@cube-ai.fr)
await EmailService.sendWelcomeEmail({
  toEmail: 'user@example.com',
  toName: 'Jean Dupont',
  subscriptionType: 'PRO',
  familyMembers: [],
  createdSessions: [],
  registrationId: 'REG123'
});

// Email de réinitialisation (utilise noreply@cube-ai.fr)
await EmailService.sendPasswordResetEmail({
  toEmail: 'user@example.com',
  toName: 'Jean Dupont',
  resetLink: 'https://cube-ai.fr/reset?token=abc123'
});

// Email de support (utilise support@cube-ai.fr)
await EmailService.sendSupportEmail({
  toEmail: 'user@example.com',
  toName: 'Jean Dupont',
  subject: 'Réponse à votre ticket',
  message: 'Nous avons résolu votre problème...',
  ticketId: 'TICKET-456'
});
```

## 🚀 API Routes

### Emails Sortants
- `GET /api/emails/logs` - Récupérer les logs d'emails
- `GET /api/emails/statistics` - Statistiques d'emails
- `POST /api/emails/retry` - Retry des emails échoués
- `POST /api/emails/cleanup` - Nettoyer les anciens logs

### Emails Entrants
- `POST /api/emails/incoming` - Webhook pour emails entrants
- `GET /api/emails/incoming` - Récupérer les emails entrants
- `PUT /api/emails/incoming/:id/status` - Mettre à jour le statut

### Bounces
- `POST /api/emails/bounce` - Webhook pour bounces

### Tests
- `POST /api/emails/send` - Envoyer un email de test

## 🔄 Jobs Automatiques

### Retry des Emails Échoués
```typescript
import { retryFailedEmailsJob } from '../jobs/emailJobs';

// Exécuté toutes les heures
setInterval(retryFailedEmailsJob, 60 * 60 * 1000);
```

### Nettoyage des Logs
```typescript
import { cleanupEmailLogsJob } from '../jobs/emailJobs';

// Exécuté quotidiennement
setInterval(cleanupEmailLogsJob, 24 * 60 * 60 * 1000);
```

## 📊 Statistiques et Monitoring

### Métriques Disponibles
- **Taux de livraison** : Emails livrés / Emails envoyés
- **Taux de bounce** : Bounces / Emails envoyés
- **Taux d'échec** : Échecs / Emails envoyés
- **Temps de livraison** : Moyenne du temps d'envoi
- **Retry rate** : Emails nécessitant des retry

### Dashboard de Monitoring
```typescript
// Récupérer les statistiques
const stats = await EmailLoggingService.getEmailStatistics({
  emailType: 'HELLO',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});

// Récupérer les emails en attente
const pending = await EmailLoggingService.getPendingEmails();

// Récupérer les emails entrants non traités
const unprocessed = await EmailLoggingService.getUnprocessedIncomingEmails();
```

## 🔒 Sécurité et Conformité

### RGPD
- **Conservation limitée** : Logs supprimés après 90 jours
- **Droit à l'oubli** : Suppression des données utilisateur
- **Consentement** : Traçabilité des consentements

### Sécurité
- **Chiffrement** : Emails envoyés en TLS
- **Authentification** : Vérification des webhooks
- **Rate limiting** : Protection contre le spam

## 🛠️ Installation et Configuration

### 1. Migration de Base de Données
```bash
# Exécuter la migration
npm run migrate:email

# Ou manuellement
node backend/scripts/run-email-migration.ts
```

### 2. Configuration des Variables d'Environnement
```bash
# Configuration des emails
HELLO_EMAIL_USER=hello@cube-ai.fr
HELLO_EMAIL_PASSWORD=your-password
HELLO_SMTP_SERVER=smtp.ionos.fr
HELLO_SMTP_PORT=465

SUPPORT_EMAIL_USER=support@cube-ai.fr
SUPPORT_EMAIL_PASSWORD=your-password
SUPPORT_SMTP_SERVER=smtp.ionos.fr
SUPPORT_SMTP_PORT=465

NOREPLY_EMAIL_USER=noreply@cube-ai.fr
NOREPLY_EMAIL_PASSWORD=your-password
NOREPLY_SMTP_SERVER=smtp.ionos.fr
NOREPLY_SMTP_PORT=465
```

### 3. Démarrage des Jobs
```typescript
import { startEmailJobs } from '../jobs/emailJobs';

// Dans votre fichier principal
startEmailJobs();
```

## 📝 Exemples d'Utilisation

### Webhook Email Entrant
```javascript
// Configuration webhook IONOS
POST https://cube-ai.fr/api/emails/incoming
Content-Type: application/json

{
  "fromEmail": "user@example.com",
  "toEmail": "support@cube-ai.fr",
  "subject": "Problème technique",
  "body": "Bonjour, j'ai un problème avec...",
  "emailType": "SUPPORT",
  "priority": "HIGH"
}
```

### Webhook Bounce
```javascript
// Configuration webhook IONOS
POST https://cube-ai.fr/api/emails/bounce
Content-Type: application/json

{
  "emailAddress": "invalid@example.com",
  "bounceType": "HARD",
  "reason": "Adresse email inexistante",
  "smtpResponse": "550 5.1.1 User unknown"
}
```

## 🔍 Dépannage

### Problèmes Courants

1. **Emails non envoyés**
   - Vérifier les logs dans `email_logs`
   - Contrôler les paramètres SMTP
   - Vérifier les bounces

2. **Emails entrants non reçus**
   - Vérifier la configuration webhook
   - Contrôler les logs d'API
   - Vérifier les permissions

3. **Statistiques incorrectes**
   - Vérifier les jobs de mise à jour
   - Contrôler les données de base
   - Vérifier les timezones

### Commandes de Debug
```bash
# Vérifier les emails en attente
curl -X GET "http://localhost:4000/api/emails/logs?status=FAILED"

# Forcer un retry
curl -X POST "http://localhost:4000/api/emails/retry"

# Nettoyer les logs
curl -X POST "http://localhost:4000/api/emails/cleanup" \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 30}'
```
