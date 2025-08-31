# Configuration du Chatbot CubeAI

## 🔧 Configuration OpenAI

### 1. Obtenir une clé API OpenAI

1. Allez sur [OpenAI Platform](https://platform.openai.com/)
2. Créez un compte ou connectez-vous
3. Allez dans **API Keys** dans le menu de gauche
4. Cliquez sur **Create new secret key**
5. Copiez la clé (elle commence par `sk-`)

### 2. Configurer l'environnement

Dans le fichier `frontend/.env.local`, remplacez :

```bash
# Remplacez par votre vraie clé API
OPENAI_API_KEY=sk-your-openai-api-key-here

# Modèle par défaut (optionnel)
OPENAI_MODEL=gpt-4o-mini
```

## 🎯 Système de Limitation par Abonnement

### Fonctionnalités par abonnement :

| Abonnement | LLM Activé | Modèle utilisé | Tokens max | Fonctionnalités |
|------------|------------|----------------|------------|-----------------|
| **STARTER** | ❌ Non | - | 0 | Base de connaissances uniquement |
| **PRO** | ✅ Oui | `gpt-4o-mini` | 400 | LLM basique + base de connaissances |
| **PREMIUM** | ✅ Oui | `gpt-4o` | 800 | LLM avancé + base de connaissances |

### Messages selon l'abonnement :

- **STARTER** : "Le mode LLM n'est disponible que pour les abonnements PRO et PREMIUM."
- **PRO/PREMIUM** : Réponses LLM complètes avec modèle adapté

## 🧪 Test du Système

### 1. Tester sans abonnement payant
```bash
# Le chatbot utilisera uniquement la base de connaissances locale
# Questions testables : "Qu'est-ce que CubeAI ?", "Comment s'inscrire ?"
```

### 2. Tester avec abonnement PRO
```bash
# Questions complexes qui nécessitent le LLM :
# "Peux-tu m'expliquer comment l'IA peut aider mon enfant ?"
# "Quels sont les avantages pédagogiques de votre approche ?"
```

### 3. Tester avec abonnement PREMIUM
```bash
# Questions très complexes avec réponses détaillées :
# "Crée un plan d'apprentissage personnalisé pour un enfant de 6 ans"
# "Explique les neurosciences derrière l'apprentissage adaptatif"
```

## 🔍 Commandes Système

- `/help` - Affiche toutes les commandes
- `/status` - Vérifie le statut de l'abonnement et des fonctionnalités
- `/reset` - Efface la conversation locale
- `/export` - Exporte la conversation en JSON
- `/mode kid` - Active le persona enfant
- `/mode pro` - Active le persona parent/professionnel

## 🚨 Dépannage

### Erreur "LLM_NOT_CONFIGURED"
- Vérifiez que `OPENAI_API_KEY` est correctement définie
- Redémarrez le serveur frontend après modification du `.env.local`

### Erreur "LLM_NOT_AVAILABLE"
- L'utilisateur a un abonnement STARTER
- Dirigez-le vers `/register` pour upgrader

### Erreur "NOT_AUTHENTICATED"
- L'utilisateur n'est pas connecté
- Dirigez-le vers `/login`

## 💰 Coûts OpenAI

| Modèle | Prix pour 1M tokens input | Prix pour 1M tokens output |
|--------|---------------------------|----------------------------|
| gpt-3.5-turbo | $0.50 | $1.50 |
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4o | $5.00 | $15.00 |

**Estimation mensuelle** (pour 1000 utilisateurs actifs) :
- PRO (400 tokens max) : ~$20-50/mois
- PREMIUM (800 tokens max) : ~$100-200/mois
