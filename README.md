# Katiopa MVP - Plateforme d'Apprentissage IA

Katiopa est une plateforme d'apprentissage innovante qui combine intelligence artificielle et pédagogie personnalisée pour les enfants et leurs parents.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- PostgreSQL 15+
- Docker et Docker Compose (optionnel)

### 1. Configuration de l'environnement

#### Variables d'environnement Backend
Créez un fichier `.env` dans le dossier `backend/` :

```bash
# Configuration de la base de données
DATABASE_URL="postgresql://katiopa_user:katiopa_password@localhost:5432/katiopa_db"

# Configuration OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# Configuration JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
COOKIE_SECRET="your-cookie-secret-key-change-in-production"

# Configuration du serveur
PORT=4000
NODE_ENV="development"

# Configuration CORS
FRONTEND_URL="http://localhost:3000"
```

### 2. Base de données

#### Option A : Docker (Recommandé)
```bash
# Démarrer PostgreSQL
docker-compose up -d postgres

# Attendre que la base soit prête
docker-compose logs postgres
```

#### Option B : PostgreSQL local
```bash
# Créer la base de données
createdb katiopa_db
createdb katiopa_user
```

### 3. Installation et démarrage

#### Backend
```bash
cd backend

# Installation des dépendances
npm install

# Génération du client Prisma
npx prisma generate

# Migration de la base de données
npx prisma migrate dev

# Seeding de la base (données de test)
npm run seed

# Démarrage du serveur de développement
npm run dev
```

#### Frontend
```bash
cd frontend

# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
```

### 4. Accès à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:4000
- **Health Check** : http://localhost:4000/health
- **Test API** : http://localhost:4000/api/test

## 🧪 Comptes de test

Après le seeding, vous pouvez vous connecter avec :

- **Email** : test@katiopa.com
- **Mot de passe** : password123

### Sessions disponibles :
- **Parent** : Session parent avec accès complet
- **Enfant** : Session enfant avec profil d'apprentissage

## 🏗️ Architecture

### Backend
- **Framework** : Express.js avec TypeScript
- **Base de données** : PostgreSQL avec Prisma ORM
- **Authentification** : JWT avec cookies sécurisés
- **IA** : OpenAI GPT-4 avec LangChain
- **RAG** : Système de récupération et génération avancée

### Frontend
- **Framework** : Next.js 14 avec React 18
- **Styling** : Tailwind CSS
- **Animations** : Framer Motion
- **État** : Hooks React personnalisés

### Base de données
- **Comptes** : Gestion des abonnements et limites
- **Sessions utilisateur** : Profils enfants et parents
- **Activités** : Suivi des progrès d'apprentissage
- **Conversations** : Historique des interactions IA
- **Profils** : Préférences et objectifs d'apprentissage

## 🔧 Commandes utiles

### Backend
```bash
# Génération Prisma
npm run db:generate

# Migration de la base
npm run db:migrate

# Studio Prisma (interface graphique)
npm run db:studio

# Seeding
npm run seed

# Build de production
npm run build
npm start
```

### Frontend
```bash
# Build de production
npm run build
npm start
```

## 📊 Fonctionnalités

### Pour les Enfants
- Apprentissage personnalisé par IA
- Suivi des progrès en temps réel
- Domaines : Mathématiques, Programmation, Lecture, Sciences, IA & Logique
- Interface ludique et adaptée à l'âge

### Pour les Parents
- Suivi détaillé des progrès
- Recommandations personnalisées
- Gestion des sessions enfants
- Rapports d'activité

### Pour les Enseignants
- Outils pédagogiques avancés
- Analyse des performances
- Recommandations d'adaptation

## 🔒 Sécurité

- Authentification JWT sécurisée
- Cookies HttpOnly et sécurisés
- Rate limiting sur les API
- Validation des données avec Zod
- Protection CORS configurée

## 🚨 Dépannage

### Erreur de connexion à la base
```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps

# Vérifier les logs
docker-compose logs postgres

# Tester la connexion
npm run db:studio
```

### Erreur OpenAI
- Vérifier que `OPENAI_API_KEY` est configurée
- Vérifier les quotas et limites de l'API

### Erreur de build
```bash
# Nettoyer les caches
rm -rf node_modules package-lock.json
npm install

# Régénérer Prisma
npx prisma generate
```

## 📝 Développement

### Structure des dossiers
```
backend/
├── src/
│   ├── routes/          # Routes API
│   ├── services/        # Services métier
│   ├── middleware/      # Middlewares
│   └── index.ts         # Point d'entrée
├── prisma/
│   ├── schema.prisma    # Schéma de base
│   └── migrations/      # Migrations
└── package.json

frontend/
├── app/                 # Pages Next.js
├── components/          # Composants React
├── hooks/              # Hooks personnalisés
└── lib/                # Utilitaires
```

### Ajout de nouvelles fonctionnalités
1. Créer le modèle dans `schema.prisma`
2. Générer la migration : `npx prisma migrate dev`
3. Créer le service dans `src/services/`
4. Créer les routes dans `src/routes/`
5. Tester avec l'API

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir le fichier `CONTRIBUTING.md` pour les directives.

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Consulter la documentation technique
- Contacter l'équipe de développement 