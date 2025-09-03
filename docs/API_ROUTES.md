# 🔌 DOCUMENTATION COMPLÈTE DES APIs - KATIOPA MVP

## 📅 **Date** : 28 août 2025
## 🎯 **Version** : 2.0.0
## 📋 **Objectif** : Documentation complète de toutes les APIs

---

## 🎯 **VUE D'ENSEMBLE DES APIs**

### **Base URL**
```
Backend : http://localhost:4000
Frontend : http://localhost:3000
```

### **Structure Générale**
- **12 modules API** fonctionnels
- **50+ endpoints** disponibles
- **Authentification JWT** obligatoire pour la plupart
- **Validation Zod** pour toutes les données
- **Gestion d'erreurs** standardisée

---

## 🔐 **AUTHENTIFICATION (`/api/auth`)**

### **Vérification disponibilité identifiant**
```http
GET /api/auth/check-session?sessionId=string
```
**Réponse** :
```json
{
  "success": true,
  "available": boolean,
  "exists": boolean
}
```

### **Inscription nouveau compte**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "password": "string",
  "confirmPassword": "string",
  "subscriptionType": "FREE|STARTER|PREMIUM",
  "familyMembers": [],
  "parentPrompts": {},
  "selectedPaymentMethod": "string",
  "payCard": {},
  "paySEPA": {},
  "payPaypal": {},
  "promoCode": "string",
  "acceptTerms": boolean
}
```

### **Connexion utilisateur**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

### **Déconnexion**
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### **Demande réinitialisation mot de passe**
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "string"
}
```

### **Confirmation réinitialisation**
```http
POST /api/auth/reset-password/confirm
Content-Type: application/json

{
  "token": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### **Récupérer profil**
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

### **Mettre à jour profil**
```http
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "string",
  "lastName": "string",
  "email": "string"
}
```

---

## 👥 **SESSIONS (`/api/sessions`)**

### **Sessions actives du compte**
```http
GET /api/sessions/active
Authorization: Bearer <jwt_token>
```

### **Créer nouvelle session**
```http
POST /api/sessions/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "sessionId": "string",
  "firstName": "string",
  "lastName": "string",
  "password": "string",
  "userType": "CHILD|PARENT",
  "age": number,
  "grade": "string",
  "country": "string",
  "timezone": "string",
  "preferences": {}
}
```

### **Mettre à jour session**
```http
PUT /api/sessions/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "string",
  "lastName": "string",
  "age": number,
  "grade": "string",
  "preferences": {}
}
```

### **Supprimer session**
```http
DELETE /api/sessions/:id
Authorization: Bearer <jwt_token>
```

### **Connexion à session**
```http
POST /api/sessions/login
Content-Type: application/json

{
  "sessionId": "string",
  "password": "string"
}
```

### **Déconnexion de session**
```http
POST /api/sessions/logout
Authorization: Bearer <jwt_token>
```

### **Activités d'une session**
```http
GET /api/sessions/:id/activities
Authorization: Bearer <jwt_token>
```

---

## 🤖 **CHAT IA (`/api/chat`)**

### **Envoyer message IA**
```http
POST /api/chat/send
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "message": "string",
  "focus": "string"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Message envoyé avec succès",
  "data": {
    "response": "string",
    "conversationId": "string"
  }
}
```

### **Historique conversations**
```http
GET /api/chat/history?limit=number
Authorization: Bearer <jwt_token>
```

### **Conversation spécifique**
```http
GET /api/chat/conversation/:id
Authorization: Bearer <jwt_token>
```

---

## 🎮 **EXPÉRIENCES (`/api/experiences`)**

### **Liste des jeux**
```http
GET /api/experiences/games
```

### **Liste des exercices**
```http
GET /api/experiences/exercises
```

### **Détails expérience**
```http
GET /api/experiences/:id
```

### **Démarrer expérience**
```http
POST /api/experiences/:id/start
Authorization: Bearer <jwt_token>
```

### **Terminer expérience**
```http
POST /api/experiences/:id/complete
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "score": number,
  "durationMs": number,
  "attempts": number
}
```

---

## 🎯 **CUBEMATCH (`/api/cubematch`)**

### **Meilleurs scores**
```http
GET /api/cubematch/scores?limit=number
```

### **Statistiques globales**
```http
GET /api/cubematch/stats
```

### **Enregistrer score**
```http
POST /api/cubematch/score
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "score": number,
  "level": number,
  "timePlayedMs": number,
  "operator": "ADD|SUBTRACT|MULTIPLY|DIVIDE",
  "target": number,
  "allowDiagonals": boolean,
  "comboMax": number,
  "cellsCleared": number,
  "hintsUsed": number,
  "gameDurationSeconds": number
}
```

### **Classement**
```http
GET /api/cubematch/leaderboard?limit=number
```

---

## 📊 **STATISTIQUES (`/api/stats`)**

### **Statistiques activités**
```http
GET /api/stats/activities
Authorization: Bearer <jwt_token>
```

### **Résumé utilisateur**
```http
GET /api/stats/summary
Authorization: Bearer <jwt_token>
```

### **Progression utilisateur**
```http
GET /api/stats/progress
Authorization: Bearer <jwt_token>
```

---

## 📈 **RAPPORTS (`/api/reports`)**

### **Générer rapports quotidiens**
```http
POST /api/reports/generate
Content-Type: application/json

{
  "date": "2025-08-28"
}
```

### **Rapports d'une session**
```http
GET /api/reports/session/:sessionId?limit=number
Authorization: Bearer <jwt_token>
```

### **Préférences rapports**
```http
PUT /api/reports/preferences
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "emailEnabled": boolean,
  "frequency": "DAILY|WEEKLY|MONTHLY",
  "includeActivities": boolean,
  "includeProgress": boolean
}
```

### **Désactiver rapports**
```http
POST /api/reports/disable/:sessionId
Authorization: Bearer <jwt_token>
```

### **Statistiques rapports**
```http
GET /api/reports/statistics?startDate=string&endDate=string&sessionId=string
Authorization: Bearer <jwt_token>
```

---

## 📧 **EMAILS (`/api/emails`)**

### **Webhook email entrant**
```http
POST /api/emails/incoming
Content-Type: application/json

{
  "fromEmail": "string",
  "toEmail": "string",
  "subject": "string",
  "body": "string",
  "headers": {},
  "messageId": "string",
  "emailType": "SUPPORT|GENERAL|BILLING",
  "priority": "LOW|NORMAL|HIGH|URGENT",
  "ticketId": "string",
  "tags": []
}
```

### **Gestion bounce**
```http
POST /api/emails/bounce
Content-Type: application/json

{
  "emailLogId": "string",
  "emailAddress": "string",
  "bounceType": "HARD|SOFT",
  "reason": "string",
  "smtpResponse": "string"
}
```

### **Statistiques emails**
```http
GET /api/emails/statistics?emailType=string&startDate=string&endDate=string
Authorization: Bearer <jwt_token>
```

### **Logs emails**
```http
GET /api/emails/logs?emailType=string&status=string&limit=number&offset=number
Authorization: Bearer <jwt_token>
```

---

## 📧 **EMAILS TRANSACTIONNELS (`/api/transactional-emails`)**

### **Email bienvenue**
```http
POST /api/transactional-emails/welcome
Content-Type: application/json

{
  "email": "string",
  "firstName": "string",
  "lastName": "string"
}
```

### **Réinitialisation mot de passe**
```http
POST /api/transactional-emails/password-reset
Content-Type: application/json

{
  "email": "string",
  "resetToken": "string",
  "firstName": "string"
}
```

### **Rapport quotidien**
```http
POST /api/transactional-emails/daily-report
Content-Type: application/json

{
  "sessionId": "string",
  "email": "string",
  "firstName": "string",
  "reportData": {}
}
```

---

## 🎯 **ACTIVITÉS (`/api/activities`)**

### **Suivre activité**
```http
POST /api/activities/track
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "domain": "string",
  "nodeKey": "string",
  "score": number,
  "attempts": number,
  "durationMs": number
}
```

### **Historique activités**
```http
GET /api/activities/history?limit=number&offset=number
Authorization: Bearer <jwt_token>
```

---

## 📍 **TRACKING (`/api/tracking`)**

### **Enregistrer événement**
```http
POST /api/tracking/event
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "eventType": "string",
  "eventData": {},
  "timestamp": "string",
  "sessionId": "string"
}
```

### **Récupérer événements**
```http
GET /api/tracking/events?eventType=string&startDate=string&endDate=string&limit=number
Authorization: Bearer <jwt_token>
```

### **Analytics tracking**
```http
GET /api/tracking/analytics?startDate=string&endDate=string&sessionId=string
Authorization: Bearer <jwt_token>
```

---

## 🧪 **TEST API**

### **Test de l'API**
```http
GET /api/test
```

**Réponse** :
```json
{
  "success": true,
  "message": "API Katiopa fonctionnelle",
  "timestamp": "2025-08-28T10:00:00.000Z",
  "version": "2.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "chat": "/api/chat",
    "activities": "/api/activities",
    "stats": "/api/stats",
    "sessions": "/api/sessions",
    "tracking": "/api/tracking",
    "experiences": "/api/experiences",
    "cubematch": "/api/cubematch",
    "emails": "/api/emails",
    "reports": "/api/reports",
    "transactionalEmails": "/api/transactional-emails"
  }
}
```

---

## 🔒 **AUTHENTIFICATION ET SÉCURITÉ**

### **JWT Token**
```http
Authorization: Bearer <jwt_token>
```

### **Format Token**
```json
{
  "userId": "string",
  "accountId": "string",
  "email": "string",
  "iat": number,
  "exp": number
}
```

### **Codes d'Erreur**
- `UNAUTHORIZED` : Token manquant ou invalide
- `FORBIDDEN` : Permissions insuffisantes
- `NOT_FOUND` : Ressource non trouvée
- `VALIDATION_ERROR` : Données invalides
- `INTERNAL_ERROR` : Erreur serveur

### **Réponse d'Erreur Standard**
```json
{
  "error": "Description de l'erreur",
  "code": "CODE_ERREUR",
  "details": {}
}
```

---

## 📊 **LIMITATIONS ET RATE LIMITING**

### **Limites par défaut**
- **Rate Limit** : 100 requêtes par 15 minutes
- **Taille payload** : 10MB maximum
- **Timeout** : 30 secondes par requête

### **Headers de Rate Limiting**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🚀 **DÉPLOIEMENT**

### **Variables d'Environnement**
```bash
# Base de données
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/katiopa_db"

# JWT
JWT_SECRET="your-secret-key"
COOKIE_SECRET="your-cookie-secret"

# Serveur
PORT=4000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# Emails
HELLO_EMAIL_USER=hello@cube-ai.fr
SUPPORT_EMAIL_USER=support@cube-ai.fr
NOREPLY_EMAIL_USER=noreply@cube-ai.fr
```

### **Démarrage**
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## ✅ **CONCLUSION**

Cette documentation couvre **toutes les APIs** du projet Katiopa MVP :

- ✅ **12 modules API** documentés
- ✅ **50+ endpoints** avec exemples
- ✅ **Authentification** et sécurité
- ✅ **Gestion d'erreurs** standardisée
- ✅ **Exemples de requêtes** et réponses

**Pour tester** : Utilisez `/api/test` pour vérifier que l'API fonctionne ! 🚀

