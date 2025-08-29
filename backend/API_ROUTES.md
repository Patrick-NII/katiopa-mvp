# 📚 Documentation des Routes API - Katiopa

## 🌐 Base URL
```
http://localhost:4000/api
```

## 🔐 Authentification
Toutes les routes protégées nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

## 📋 Routes Disponibles

### 🔑 Authentification (`/auth`)

#### `POST /auth/register`
Inscription d'un nouveau compte familial
```json
{
  "email": "famille@example.com",
  "subscriptionType": "PRO",
  "maxSessions": 4,
  "familyMembers": [...]
}
```

#### `POST /auth/login`
Connexion avec ID de session et mot de passe
```json
{
  "sessionId": "PATRICK_007",
  "password": "password123"
}
```

#### `GET /auth/me`
Récupération du profil utilisateur connecté
- **Protégée** : Oui
- **Retour** : Profil utilisateur complet

#### `GET /auth/verify`
Vérification de la validité d'un token
- **Protégée** : Non
- **Retour** : Statut du token

### 📊 Statistiques (`/stats`)

#### `GET /stats/activities`
Récupération des activités récentes de l'utilisateur
- **Protégée** : Oui
- **Paramètres** : `limit` (optionnel, défaut: 20)
- **Retour** : Liste des activités

#### `GET /stats/summary`
Résumé des performances par domaine
- **Protégée** : Oui
- **Retour** : Moyennes par domaine d'apprentissage

### 🤖 LLM (`/llm`)

#### `POST /llm/evaluate`
Évaluation des performances et recommandations d'exercices
- **Protégée** : Oui
- **Body** : `{ "focus": "maths" }` (optionnel)
- **Retour** : Évaluation et exercices recommandés

### 🎯 Activités (`/activity`)

#### `POST /activity`
Création d'une nouvelle activité d'apprentissage
- **Protégée** : Oui
- **Body** :
```json
{
  "domain": "maths",
  "nodeKey": "maths.addition.1digit",
  "score": 85,
  "attempts": 2,
  "durationMs": 18000
}
```

## 🔧 Routes Système

### `GET /health`
Vérification de l'état du serveur et de la base de données

### `GET /test-db`
Test de connexion à la base de données

## 📝 Codes de Réponse

- **200** : Succès
- **201** : Créé avec succès
- **400** : Erreur de validation
- **401** : Non autorisé
- **404** : Ressource non trouvée
- **500** : Erreur interne du serveur

## 🚀 Exemples d'Utilisation

### Connexion et Récupération de Profil
```bash
# 1. Connexion
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "PATRICK_MARTIN", "password": "password123"}'

# 2. Récupération du profil avec le token
TOKEN="<token_from_step_1>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/auth/me
```

### Création d'Activité
```bash
curl -X POST http://localhost:4000/api/activity \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "maths",
    "nodeKey": "maths.addition.1digit",
    "score": 90,
    "attempts": 1,
    "durationMs": 15000
  }'
```

## 🔒 Sécurité

- Rate limiting : 100 requêtes par 15 minutes
- Validation des données avec Zod
- Gestion d'erreurs standardisée
- Logs de sécurité pour les tentatives d'authentification

## 📊 Domaines d'Apprentissage Supportés

- **maths** : Mathématiques
- **francais** : Français
- **sciences** : Sciences
- **coding** : Programmation
- **arts** : Arts plastiques
- **history** : Histoire
