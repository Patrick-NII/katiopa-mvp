# Configuration des Emails CubeAI

## 📧 Adresses Email Spécialisées

CubeAI utilise trois adresses email spécialisées selon le type de communication :

### 1. **hello@cube-ai.fr** - Communication Générale et Marketing
- **Usage** : Emails de bienvenue, communication marketing, newsletters
- **Ton** : Amical et chaleureux
- **Signature** : "CubeAI - Équipe"
- **Exemples** :
  - Emails de bienvenue
  - Newsletters marketing
  - Communications promotionnelles
  - Messages de parrainage

### 2. **support@cube-ai.fr** - Support Technique et SAV
- **Usage** : Assistance technique, tickets de support, SAV
- **Ton** : Professionnel et serviable
- **Signature** : "CubeAI - Support"
- **Exemples** :
  - Réponses aux tickets de support
  - Assistance technique
  - Résolution de problèmes
  - Informations sur les abonnements

### 3. **noreply@cube-ai.fr** - Envois Automatiques
- **Usage** : Confirmations, notifications automatiques, factures
- **Ton** : Neutre et informatif
- **Signature** : "CubeAI"
- **Exemples** :
  - Réinitialisation de mot de passe
  - Confirmations d'inscription
  - Factures et reçus
  - Notifications de sécurité

## 🔧 Configuration

### Variables d'Environnement

```bash
# Configuration des emails - Communication générale et marketing
HELLO_EMAIL_USER=hello@cube-ai.fr
HELLO_EMAIL_PASSWORD=your-hello-email-password
HELLO_SMTP_SERVER=smtp.ionos.fr
HELLO_SMTP_PORT=465

# Configuration des emails - Support technique et SAV
SUPPORT_EMAIL_USER=support@cube-ai.fr
SUPPORT_EMAIL_PASSWORD=your-support-email-password
SUPPORT_SMTP_SERVER=smtp.ionos.fr
SUPPORT_SMTP_PORT=465

# Configuration des emails - Envois automatiques
NOREPLY_EMAIL_USER=noreply@cube-ai.fr
NOREPLY_EMAIL_PASSWORD=your-noreply-email-password
NOREPLY_SMTP_SERVER=smtp.ionos.fr
NOREPLY_SMTP_PORT=465
```

## 🚀 Utilisation

### Service Email Centralisé (TypeScript)

```typescript
import { EmailService } from '../services/emailService';

// Email de bienvenue (utilise hello@cube-ai.fr)
await EmailService.sendWelcomeEmail({
  toEmail: 'user@example.com',
  toName: 'Jean Dupont',
  subscriptionType: 'PRO',
  familyMembers: [...],
  createdSessions: [...],
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
  subject: 'Problème de connexion',
  message: 'Nous avons bien reçu votre demande...',
  ticketId: 'TICKET-456'
});
```

### Script Python

```bash
# Email de bienvenue avec hello@cube-ai.fr
python backend/scripts/send_welcome_email.py \
  --to user@example.com \
  --to-name "Jean Dupont" \
  --account-username "jean.dupont" \
  --account-password "TempPass123" \
  --plan PRO \
  --email-type hello

# Email de support avec support@cube-ai.fr
python backend/scripts/send_welcome_email.py \
  --to user@example.com \
  --to-name "Jean Dupont" \
  --account-username "jean.dupont" \
  --account-password "TempPass123" \
  --plan PRO \
  --email-type support
```

## 📋 Règles d'Utilisation

### Sélection Automatique du Type d'Email

| Type de Communication | Adresse Utilisée | Raison |
|----------------------|------------------|---------|
| Bienvenue/Onboarding | hello@cube-ai.fr | Ton chaleureux et accueillant |
| Marketing/Newsletter | hello@cube-ai.fr | Communication commerciale |
| Support/Tickets | support@cube-ai.fr | Assistance technique |
| Réinitialisation MDP | noreply@cube-ai.fr | Sécurité et automatisation |
| Factures/Reçus | noreply@cube-ai.fr | Documents officiels |
| Notifications | noreply@cube-ai.fr | Informations automatiques |

### Bonnes Pratiques

1. **Toujours utiliser l'adresse appropriée** selon le contexte
2. **Respecter le ton** associé à chaque adresse
3. **Inclure les informations de contact** appropriées dans chaque email
4. **Tester les configurations** avant déploiement en production
5. **Monitorer les logs** pour détecter les problèmes d'envoi

## 🔍 Dépannage

### Problèmes Courants

1. **Email non reçu** : Vérifier les logs SMTP et les spams
2. **Erreur d'authentification** : Vérifier les mots de passe dans les variables d'environnement
3. **Email rejeté** : Vérifier la configuration SPF/DKIM du domaine

### Logs de Debug

```bash
# Vérifier la configuration
node -e "console.log(require('./src/config/emailConfig').EMAIL_CONFIG)"

# Tester l'envoi
node -e "require('./src/services/emailService').EmailService.sendTestEmail()"
```

## 📝 Migration

### Ancienne Configuration → Nouvelle Configuration

| Ancien | Nouveau |
|--------|---------|
| `SMTP_USERNAME` | `HELLO_EMAIL_USER` |
| `SMTP_PASSWORD` | `HELLO_EMAIL_PASSWORD` |
| `SMTP_HOST` | `HELLO_SMTP_SERVER` |
| `SMTP_PORT` | `HELLO_SMTP_PORT` |

### Mise à Jour des Scripts

Les anciens scripts utilisant `SMTP_USERNAME` doivent être mis à jour pour utiliser la nouvelle configuration :

```typescript
// Avant
const smtpUser = process.env.SMTP_USERNAME;

// Après
import { getEmailConfig } from '../config/emailConfig';
const emailConfig = getEmailConfig('hello');
const smtpUser = emailConfig.user;
```
