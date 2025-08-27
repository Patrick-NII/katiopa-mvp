# 🎯 Katiopa MVP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-blue.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.16.1-orange.svg)](https://www.prisma.io/)

> **Plateforme d'apprentissage adaptatif IA pour enfants de 5-7 ans** 🧒✨

Un MVP complet et fonctionnel intégrant authentification, statistiques en temps réel, et évaluation LLM pour proposer des exercices personnalisés.

## 🚀 **Fonctionnalités**

- 🔐 **Authentification complète** : Inscription/Connexion avec JWT sécurisé
- 📊 **Dashboard interactif** : Vue d'ensemble des activités et statistiques
- 🤖 **Intégration LLM** : Évaluation OpenAI pour recommandations d'exercices
- 🎯 **Apprentissage adaptatif** : Propositions basées sur les performances
- 📱 **Interface moderne** : Design responsive avec Tailwind CSS
- 🗄️ **Base de données robuste** : PostgreSQL + Prisma ORM

## 🛠️ **Stack Technique**

### **Backend**
- **Runtime** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL + Prisma ORM
- **Authentification** : JWT + bcrypt
- **Validation** : Zod schemas
- **LLM** : OpenAI GPT-4o-mini API

### **Frontend**
- **Framework** : Next.js 14 + TypeScript
- **Styling** : Tailwind CSS
- **État** : React Hooks
- **Navigation** : App Router (Next.js 13+)

### **Infrastructure**
- **Base de données** : Docker + PostgreSQL 16
- **Développement** : Hot reload + TypeScript watch
- **Versioning** : Git + GitHub

## 📁 **Architecture du Projet**

```
katiopa-mvp/
├── 🐳 docker-compose.yml          # PostgreSQL
├── 📚 README.md                   # Documentation
├── 📄 LICENSE                     # Licence MIT
├── 🔧 .gitignore                  # Fichiers exclus
├── 🖥️  backend/                   # API Express
│   ├── 📦 package.json
│   ├── 🗄️  prisma/               # Schéma DB + migrations
│   ├── 🔐 src/
│   │   ├── middleware/            # Auth JWT
│   │   ├── routes/                # Endpoints API
│   │   ├── utils/                 # Utilitaires
│   │   └── index.ts              # Serveur principal
│   └── 🌱 seed.ts                # Données d'exemple
└── 🎨 frontend/                   # App Next.js
    ├── 📦 package.json
    ├── 🎯 app/                    # Pages (App Router)
    ├── 🧩 components/             # Composants réutilisables
    ├── 🔌 lib/                    # Utilitaires frontend
    └── 🎨 styles/                 # CSS global
```

## 🚀 **Installation Rapide**

### **Prérequis**
- Node.js 18+ et npm
- Docker Desktop
- Clé API OpenAI

### **1. Cloner le projet**
```bash
git clone https://github.com/Patrick-NII/katiopa-mvp.git
cd katiopa-mvp
```

### **2. Base de données**
```bash
docker-compose up -d db
```

### **3. Backend**
```bash
cd backend
npm install
cp .env.example .env  # Configurez vos variables
npm run db:push      # Créez la base
npm run dev          # Lancez l'API (port 4000)
```

### **4. Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local  # Configurez l'URL API
npm run dev                       # Lancez l'app (port 3000)
```

## 🔑 **Configuration des Variables d'Environnement**

### **Backend (.env)**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/katiopa
JWT_SECRET=votre-secret-jwt-super-securise
OPENAI_API_KEY=sk-votre-cle-openai
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

### **Frontend (.env.local)**
```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

## 📊 **Endpoints API**

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/auth/register` | Inscription utilisateur | ❌ |
| `POST` | `/auth/login` | Connexion utilisateur | ❌ |
| `GET` | `/auth/me` | Profil utilisateur | ✅ |
| `GET` | `/stats/activities` | Activités récentes | ✅ |
| `GET` | `/stats/summary` | Résumé par domaine | ✅ |
| `POST` | `/llm/evaluate` | Évaluation LLM | ✅ |
| `POST` | `/activity` | Créer une activité | ✅ |

## 🎯 **Utilisation**

1. **Accueil** : http://localhost:3000
2. **Inscription** : http://localhost:3000/register
3. **Connexion** : http://localhost:3000/login
4. **Dashboard** : http://localhost:3000/dashboard (après connexion)
5. **Test API** : http://localhost:3000/test

## 🔧 **Scripts Utiles**

```bash
# Backend
npm run dev          # Développement avec hot reload
npm run build        # Build de production
npm run start        # Serveur de production
npm run seed         # Insérer des données d'exemple
npm run db:studio    # Interface Prisma Studio
npm run db:push      # Synchroniser le schéma DB

# Frontend
npm run dev          # Développement avec hot reload
npm run build        # Build de production
npm run start        # Serveur de production
```

## 🧪 **Tests et Développement**

### **Page de Test**
- **URL** : `/test`
- **Fonctionnalités** : Vérification du token JWT et test des appels API
- **Utilisation** : Debug et validation de l'authentification

### **Données d'Exemple**
```bash
cd backend
npm run seed
```

## 🚀 **Prochaines Étapes**

- [ ] **Cookies httpOnly** pour sécuriser JWT
- [ ] **Mapping nodeKey → contenu** des exercices
- [ ] **Graphe de connaissances** pour l'adaptation
- [ ] **Tests automatisés** (Jest + Testing Library)
- [ ] **Déploiement Docker** complet
- [ ] **CI/CD** avec GitHub Actions
- [ ] **Monitoring** et analytics

## 🤝 **Contribution**

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 **Licence**

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 **Auteur**

**Patrick NII** - [@Patrick-NII](https://github.com/Patrick-NII)

- 🌐 Portfolio : [niia.fr](https://niia.fr)
- 💼 LinkedIn : [patrick-ngunga-a2612325b](https://linkedin.com/in/patrick-ngunga-a2612325b)
- 📧 Email : patrick.nii@aol.com

---

## ⭐ **Support**

Si ce projet vous plaît, n'oubliez pas de lui donner une étoile sur GitHub !

**Katiopa** - Apprendre l'IA en s'amusant ! 🎮🧠✨ 