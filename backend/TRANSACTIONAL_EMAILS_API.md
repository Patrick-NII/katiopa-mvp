# API des Emails Transactionnels CubeAI

## Vue d'ensemble

L'API des emails transactionnels permet de générer et d'envoyer des emails automatisés pour CubeAI. Elle utilise des templates MJML avec des variables personnalisables et supporte différents types d'emails selon le contexte.

## Endpoints disponibles

### 1. Obtenir les exemples de variables
```
GET /api/transactional-emails/examples
```

**Réponse :**
```json
{
  "success": true,
  "examples": {
    "account_creation": {
      "variables": {
        "parent_email": "parent@example.com",
        "parent_full_name": "Jean Dupont",
        "account_id": "ACC-123456",
        "account_type": "PRO"
      }
    },
    "daily_report": {
      "variables": {
        "session_id": "SESS-123",
        "child_first_name": "Lina",
        "child_last_name": "Dupont",
        "child_nickname": "Lina",
        "child_age": 6,
        "kpi_assiduite": 85,
        "kpi_comprehension": 78,
        "kpi_progression": 72,
        "report_text": "Lina a bien progressé aujourd'hui...",
        "manage_link": "https://cube-ai.fr/manage",
        "unsubscribe_link": "https://cube-ai.fr/unsubscribe"
      }
    }
  },
  "availableTypes": [
    "account_creation",
    "daily_report", 
    "password_reset_request",
    "password_reset_confirmation",
    "billing_confirmation",
    "support_receipt"
  ]
}
```

### 2. Générer un email
```
POST /api/transactional-emails/generate
```

**Corps de la requête :**
```json
{
  "type": "account_creation",
  "variables": {
    "parent_email": "parent@example.com",
    "parent_full_name": "Jean Dupont",
    "account_id": "ACC-123456",
    "account_type": "PRO"
  },
  "emailType": "noreply"
}
```

**Réponse :**
```json
{
  "success": true,
  "email": {
    "subject": "CubeAI — Votre compte parent est prêt (ACC-123456)",
    "from": "CubeAI <noreply@cube-ai.fr>",
    "replyTo": "support@cube-ai.fr",
    "htmlLength": 6488,
    "textLength": 845,
    "html": "<!DOCTYPE html>...",
    "text": "Bonjour Jean Dupont,..."
  }
}
```

### 3. Envoyer un email
```
POST /api/transactional-emails/send
```

**Corps de la requête :**
```json
{
  "type": "account_creation",
  "to": "parent@example.com",
  "variables": {
    "parent_email": "parent@example.com",
    "parent_full_name": "Jean Dupont",
    "account_id": "ACC-123456",
    "account_type": "PRO"
  },
  "emailType": "noreply"
}
```

**Réponse :**
```json
{
  "success": true,
  "messageId": "<message-id@cube-ai.fr>",
  "message": "Email envoyé avec succès"
}
```

### 4. Tester avec des données d'exemple
```
POST /api/transactional-emails/test
```

**Corps de la requête :**
```json
{
  "type": "account_creation",
  "to": "test@example.com",
  "emailType": "noreply"
}
```

## Types d'emails disponibles

### 1. account_creation
Email envoyé lors de la création d'un compte parent.

**Variables requises :**
- `parent_email` : Email du parent
- `parent_full_name` : Nom complet du parent
- `account_id` : ID du compte
- `account_type` : Type de compte (FREE, PRO, PRO_PLUS)

### 2. daily_report
Email de rapport quotidien envoyé aux parents.

**Variables requises :**
- `session_id` : ID de la session
- `child_first_name` : Prénom de l'enfant
- `child_last_name` : Nom de l'enfant
- `child_nickname` : Surnom de l'enfant
- `child_age` : Âge de l'enfant
- `kpi_assiduite` : Score d'assiduité (0-100)
- `kpi_comprehension` : Score de compréhension (0-100)
- `kpi_progression` : Score de progression (0-100)
- `report_text` : Texte du rapport
- `manage_link` : Lien de gestion
- `unsubscribe_link` : Lien de désinscription

### 3. password_reset_request
Email de demande de réinitialisation de mot de passe.

**Variables requises :**
- `sessions` : Liste des sessions de l'utilisateur
- `reset_start_url` : URL de début de réinitialisation
- `reset_token` : Token de réinitialisation
- `token_ttl_minutes` : Durée de validité du token

### 4. password_reset_confirmation
Email de confirmation de réinitialisation de mot de passe.

**Variables requises :**
- `sessions` : Liste des sessions de l'utilisateur
- `login_url` : URL de connexion

### 5. billing_confirmation
Email de confirmation de facturation.

**Variables requises :**
- `plan_name` : Nom du plan
- `amount_ttc` : Montant TTC
- `currency` : Devise
- `payment_method` : Méthode de paiement
- `next_billing_date_fr` : Date de prochaine facturation
- `invoice_number` : Numéro de facture
- `billing_portal_url` : URL du portail de facturation

### 6. support_receipt
Email d'accusé de réception pour le support.

**Variables requises :**
- `ticket_id` : ID du ticket
- `subject_line` : Sujet du ticket
- `priority` : Priorité du ticket
- `received_at_fr` : Date de réception

## Types d'emails d'expédition

### noreply
- **From :** `noreply@cube-ai.fr`
- **Reply-To :** `support@cube-ai.fr`
- **Nom :** `CubeAI`

### support
- **From :** `support@cube-ai.fr`
- **Reply-To :** `support@cube-ai.fr`
- **Nom :** `CubeAI Support`

### hello
- **From :** `hello@cube-ai.fr`
- **Reply-To :** `hello@cube-ai.fr`
- **Nom :** `CubeAI`

## Scripts de test

### Test complet
```bash
npm run test:transactional-api
```

### Test avec envoi
```bash
npm run test:transactional-api votre-email@domaine.com
```

### Test de génération uniquement
```bash
npm run test:transactional-api-simple
```

## Configuration

L'API utilise les variables d'environnement suivantes :

```env
# Configuration des emails - Envois automatiques
NOREPLY_EMAIL_USER=noreply@cube-ai.fr
NOREPLY_EMAIL_PASSWORD=password
NOREPLY_SMTP_SERVER=smtp.ionos.fr
NOREPLY_SMTP_PORT=465

# Configuration des emails - Support technique
SUPPORT_EMAIL_USER=support@cube-ai.fr
SUPPORT_EMAIL_PASSWORD=password
SUPPORT_SMTP_SERVER=smtp.ionos.fr
SUPPORT_SMTP_PORT=465

# Configuration des emails - Communication générale
HELLO_EMAIL_USER=hello@cube-ai.fr
HELLO_EMAIL_PASSWORD=password
HELLO_SMTP_SERVER=smtp.ionos.fr
HELLO_SMTP_PORT=465
```

## Gestion des erreurs

L'API retourne des codes d'erreur HTTP standard :

- `400` : Paramètres manquants ou invalides
- `500` : Erreur interne du serveur

**Exemple d'erreur :**
```json
{
  "success": false,
  "error": "Type et variables requis"
}
```

## Logs et monitoring

Tous les envois d'emails sont loggés dans la base de données avec :
- Type d'email
- Destinataire
- Statut d'envoi
- Message ID
- Horodatage
- Erreurs éventuelles

## Sécurité

- Rate limiting : 100 requêtes par 15 minutes
- Validation des variables d'entrée
- Logs de sécurité pour détecter les abus
- Support TLS pour les connexions SMTP
