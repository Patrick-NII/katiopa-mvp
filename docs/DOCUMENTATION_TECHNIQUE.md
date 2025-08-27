# 📚 DOCUMENTATION TECHNIQUE COMPLÈTE - KATIOPA MVP

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble du projet](#vue-densemble-du-projet)
2. [Architecture technique](#architecture-technique)
3. [Backend - Documentation complète](#backend---documentation-complète)
4. [Frontend - Documentation complète](#frontend---documentation-complète)
5. [Base de données](#base-de-données)
6. [Problèmes rencontrés et solutions](#problèmes-rencontrés-et-solutions)
7. [Choix techniques et justifications](#choix-techniques-et-justifications)
8. [Tests et validation](#tests-et-validation)
9. [Déploiement et maintenance](#déploiement-et-maintenance)
10. [Évolutions futures](#évolutions-futures)

---

## 🎯 VUE D'ENSEMBLE DU PROJET

### **Description du projet**
Katiopa est une plateforme d'apprentissage adaptatif pour enfants âgés de 5 à 7 ans. L'application propose un système d'évaluation personnalisée basé sur l'IA (LLM) et un suivi détaillé des progrès de l'enfant.

### **Objectifs du MVP**
- Système d'authentification multi-utilisateur
- Interface d'apprentissage personnalisée
- Intégration LLM pour l'évaluation
- Suivi des statistiques et progrès
- Gestion des comptes et abonnements

### **Public cible**
- **Enfants** : 5-7 ans (CP-CE1)
- **Parents** : Suivi et gestion des comptes
- **Enseignants** : Interface pédagogique
- **Administrateurs** : Gestion de la plateforme

---

## 🏗️ ARCHITECTURE TECHNIQUE

### **Stack technologique**
- **Backend** : Node.js + Express + TypeScript + Prisma
- **Frontend** : Next.js 14 + React + TypeScript + Tailwind CSS
- **Base de données** : PostgreSQL
- **Authentification** : JWT
- **IA/LLM** : OpenAI GPT-4o-mini
- **Déploiement** : Docker + Docker Compose

### **Architecture générale**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Base de       │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   données       │
│   Port 3000     │    │   Port 4000     │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Composants    │    │   Middlewares   │    │   Schéma        │
│   React         │    │   (Auth, CORS)  │    │   Prisma        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Principe de fonctionnement**
1. **Frontend** : Interface utilisateur avec composants React
2. **Backend** : API REST avec gestion des routes et middleware
3. **Base de données** : Stockage persistant avec Prisma ORM
4. **Communication** : API REST entre frontend et backend
5. **Sécurité** : JWT pour l'authentification, CORS pour la sécurité

---

## 🔧 BACKEND - DOCUMENTATION COMPLÈTE

### **Structure des dossiers**
```
backend/
├── src/
│   ├── index.ts              # Point d'entrée principal
│   ├── prisma.ts             # Configuration Prisma
│   ├── middleware/
│   │   └── auth.ts           # Middleware d'authentification
│   └── routes/
│       ├── auth.ts            # Routes d'authentification
│       ├── stats.ts           # Routes des statistiques
│       ├── llm.ts             # Routes LLM/IA
│       └── activity.ts        # Routes des activités
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   └── seed-multi-user.ts     # Script de seeding
└── package.json               # Dépendances et scripts
```

### **Configuration et environnement**
- **Port** : 4000 (configurable via variable d'environnement)
- **Variables d'environnement** : `.env` avec CORS_ORIGIN
- **Base de données** : PostgreSQL via Prisma
- **Logs** : Morgan pour les logs HTTP

---

## 🎨 FRONTEND - DOCUMENTATION COMPLÈTE

### **Structure des dossiers**
```
frontend/
├── app/                      # App Router Next.js 14
│   ├── layout.tsx            # Layout principal
│   ├── page.tsx              # Page d'accueil
│   ├── login/
│   │   └── page.tsx          # Page de connexion
│   ├── register/
│   │   └── page.tsx          # Page d'inscription
│   └── dashboard/
│       └── page.tsx          # Dashboard principal
├── components/               # Composants React réutilisables
│   ├── AuthGuard.tsx         # Protection d'authentification
│   ├── UserHeader.tsx        # En-tête utilisateur
│   ├── NavBar.tsx            # Navigation principale
│   └── ...                   # Autres composants
├── hooks/                    # Hooks React personnalisés
│   ├── useSession.ts         # Gestion de session
│   ├── useGlobalTime.ts      # Temps global
│   └── useTotalConnectionTime.ts # Temps de connexion total
├── lib/                      # Utilitaires et configuration
│   └── api.ts                # Client API centralisé
└── types/                    # Types TypeScript
```

### **Configuration et environnement**
- **Port** : 3000
- **Variables d'environnement** : `.env.local` avec NEXT_PUBLIC_API_BASE
- **Styling** : Tailwind CSS avec composants personnalisés
- **Animations** : Framer Motion pour les transitions

---

## 🗄️ BASE DE DONNÉES

### **Schéma Prisma**
Le schéma définit plusieurs modèles :
- **Account** : Compte principal avec abonnement
- **UserSession** : Sessions utilisateur individuelles
- **UserProfile** : Profils détaillés des utilisateurs
- **Activity** : Activités et exercices
- **BillingRecord** : Historique de facturation

### **Relations**
- Un Account peut avoir plusieurs UserSession
- Chaque UserSession a un UserProfile
- Les activités sont liées aux UserSession
- Système de clés étrangères avec Prisma

---

## 🚨 PROBLÈMES RENCONTRÉS ET SOLUTIONS

### **1. Problème de stabilité du backend**
**Symptôme** : `ERR_CONNECTION_REFUSED` récurrent
**Cause** : Processus multiples et conflits de ports
**Solution** : Middlewares de robustesse et gestion des processus

### **2. Appels API prématurés**
**Symptôme** : Erreurs de chargement de profil sur la page de connexion
**Cause** : Composants protégés qui se déclenchent globalement
**Solution** : Création d'AuthGuard et isolation des composants

### **3. Configuration CORS et API**
**Symptôme** : Erreurs de communication frontend-backend
**Cause** : Configuration incorrecte des URLs d'API
**Solution** : Centralisation de la configuration API et variables d'environnement

---

## ⚙️ CHOIX TECHNIQUES ET JUSTIFICATIONS

### **Backend Node.js + Express**
- **Performance** : Event-loop non-bloquant
- **Écosystème** : Large communauté et packages
- **TypeScript** : Typage statique pour la robustesse

### **Frontend Next.js 14**
- **App Router** : Architecture moderne et performante
- **SSR/SSG** : Optimisations SEO et performance
- **TypeScript** : Cohérence avec le backend

### **Base de données PostgreSQL + Prisma**
- **PostgreSQL** : Base relationnelle robuste et performante
- **Prisma** : ORM moderne avec migrations automatiques
- **Type safety** : Génération automatique des types TypeScript

---

## 🧪 TESTS ET VALIDATION

### **Tests manuels effectués**
- Connexion avec comptes de test
- Création de nouveaux comptes
- Navigation dans le dashboard
- Fonctionnalités LLM
- Gestion des erreurs

### **Validation des fonctionnalités**
- ✅ Authentification multi-utilisateur
- ✅ Gestion des sessions
- ✅ Interface d'apprentissage
- ✅ Intégration LLM
- ✅ Suivi des statistiques

---

## 🚀 DÉPLOIEMENT ET MAINTENANCE

### **Environnement de développement**
- Backend : `npm run dev` (port 4000)
- Frontend : `npm run dev` (port 3000)
- Base de données : Docker PostgreSQL

### **Scripts disponibles**
- `npm run build` : Build de production
- `npm run start` : Démarrage de production
- `npm run db:generate` : Génération Prisma
- `npm run db:push` : Synchronisation base de données

---

## 🔮 ÉVOLUTIONS FUTURES

### **Fonctionnalités prévues**
- Système de notifications
- Analytics avancés
- Intégration de nouveaux LLM
- Application mobile
- API publique

### **Améliorations techniques**
- Tests automatisés
- CI/CD pipeline
- Monitoring et observabilité
- Cache Redis
- Load balancing

---

## 📝 NOTES DE DÉVELOPPEMENT

### **Bonnes pratiques appliquées**
- Séparation des responsabilités
- Composants réutilisables
- Gestion d'erreurs centralisée
- Documentation du code
- Types TypeScript stricts

### **Leçons apprises**
- Importance de l'isolation des composants
- Gestion des processus de développement
- Configuration des middlewares de robustesse
- Centralisation de la configuration API

---

*Document créé le : 31 décembre 2025*  
*Version : 1.0*  
*Maintenu par : Équipe de développement Katiopa* 