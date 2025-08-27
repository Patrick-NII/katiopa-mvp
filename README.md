# Katiopa MVP

Un MVP complet pour l'apprentissage adaptatif des enfants de 5-7 ans avec authentification, statistiques et évaluation LLM.

## 🚀 Fonctionnalités

- **Authentification** : Inscription/Connexion avec JWT
- **Dashboard** : Vue d'ensemble des activités et statistiques
- **LLM Integration** : Évaluation OpenAI pour proposer des exercices adaptés
- **Base de données** : Prisma + PostgreSQL pour les activités utilisateur

## 🛠️ Stack Technique

- **Backend** : Node.js + Express + TypeScript + Prisma
- **Frontend** : Next.js + TypeScript + Tailwind CSS
- **Base de données** : PostgreSQL
- **LLM** : OpenAI GPT-4o-mini

## 📁 Structure

```
katiopa-mvp/
├── backend/          # API Express + Prisma
├── frontend/         # App Next.js
└── docker-compose.yml # PostgreSQL
```

## 🚀 Installation Rapide

### 1. Base de données
```bash
docker-compose up -d db
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env  # Configurez vos variables
npm run db:push      # Créez la base
npm run dev          # Lancez l'API
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local  # Configurez l'URL API
npm run dev                       # Lancez l'app
```

## 🔑 Variables d'Environnement

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/katiopa
JWT_SECRET=votre-secret-jwt
OPENAI_API_KEY=sk-votre-cle-openai
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

## 📊 Endpoints API

- `POST /auth/register` - Inscription utilisateur
- `POST /auth/login` - Connexion utilisateur
- `GET /auth/me` - Profil utilisateur
- `GET /stats/activities` - Activités récentes
- `GET /stats/summary` - Résumé par domaine
- `POST /llm/evaluate` - Évaluation LLM
- `POST /activity` - Créer une activité

## 🎯 Utilisation

1. Créez un compte via `/register`
2. Connectez-vous via `/login`
3. Accédez au dashboard pour voir vos statistiques
4. Utilisez l'évaluation LLM pour obtenir des recommandations d'exercices

## 🔧 Scripts Utiles

```bash
# Backend
npm run seed        # Insérer des données d'exemple
npm run db:studio   # Interface Prisma Studio
npm run build       # Build de production

# Frontend
npm run build       # Build de production
npm run start       # Serveur de production
```

## 🚀 Prochaines Étapes

- [ ] Cookies httpOnly pour sécuriser JWT
- [ ] Mapping nodeKey → contenu des exercices
- [ ] Graphe de connaissances pour l'adaptation
- [ ] Déploiement Docker complet
- [ ] Tests automatisés

---

**Note** : Ce MVP est prêt pour le développement et les tests. Assurez-vous d'avoir une clé OpenAI valide pour tester l'évaluation LLM. 