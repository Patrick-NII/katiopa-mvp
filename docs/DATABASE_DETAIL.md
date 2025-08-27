# 🗄️ BASE DE DONNÉES - DOCUMENTATION DÉTAILLÉE

## 📁 STRUCTURE DE LA BASE DE DONNÉES

### **Organisation des fichiers**
```
backend/prisma/
├── schema.prisma              # Schéma principal de la base de données
├── migrations/                # Historique des migrations
│   └── 001_multi_user_accounts.sql
└── seed-multi-user.ts         # Script de population des données
```

---

## 🏗️ SCHÉMA PRISMA (schema.prisma)

### **Description**
Le schéma Prisma définit la structure complète de la base de données avec tous les modèles, relations et contraintes.

### **Configuration de base**
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 📊 MODÈLES DE DONNÉES

### **1. Modèle Account (Compte Principal)**

#### **Description**
Représente le compte principal d'une famille ou organisation. Un compte peut avoir plusieurs sessions utilisateur.

#### **Structure complète**
```prisma
model Account {
  id                                String           @id @default(cuid())
  email                             String           @unique
  subscriptionType                  SubscriptionType @default(FREE)
  maxSessions                       Int              @default(1)
  totalAccountConnectionDurationMs  BigInt          @default(0)
  createdAt                         DateTime         @default(now())
  updatedAt                         DateTime         @updatedAt

  // Relations
  userSessions                     UserSession[]
  billingRecords                   BillingRecord[]

  // Index pour les performances
  @@index([email])
  @@index([subscriptionType])
  @@index([createdAt])
}
```

#### **Champs détaillés**
- **id** : Identifiant unique du compte (CUID)
- **email** : Adresse email unique du compte
- **subscriptionType** : Type d'abonnement (FREE, PRO, PRO_PLUS)
- **maxSessions** : Nombre maximum de sessions utilisateur autorisées
- **totalAccountConnectionDurationMs** : Temps total de connexion de tous les utilisateurs
- **createdAt** : Date de création du compte
- **updatedAt** : Date de dernière modification

#### **Relations**
- **userSessions** : Une relation one-to-many avec UserSession
- **billingRecords** : Une relation one-to-many avec BillingRecord

---

### **2. Modèle UserSession (Session Utilisateur)**

#### **Description**
Représente une session utilisateur individuelle. Chaque utilisateur (enfant, parent, enseignant) a sa propre session.

#### **Structure complète**
```prisma
model UserSession {
  id                           String           @id @default(cuid())
  sessionId                    String           @unique
  firstName                    String
  lastName                     String
  email                       String?
  gender                      Gender           @default(UNKNOWN)
  userType                    UserType         @default(CHILD)
  age                         Int?
  grade                       String?
  country                     String?
  timezone                    String?
  preferences                 Json?
  password                    String           @default("password123")
  lastLoginAt                 DateTime?
  currentSessionStartTime      DateTime?
  totalConnectionDurationMs    BigInt          @default(0)
  createdAt                   DateTime         @default(now())
  updatedAt                   DateTime         @updatedAt

  // Relations
  accountId                   String
  account                     Account          @relation(fields: [accountId], references: [id], onDelete: Cascade)
  profile                     UserProfile?
  activities                  Activity[]

  // Index pour les performances
  @@index([sessionId])
  @@index([accountId])
  @@index([userType])
  @@index([createdAt])
  @@index([lastLoginAt])
}
```

#### **Champs détaillés**
- **id** : Identifiant unique de la session (CUID)
- **sessionId** : Identifiant de session unique pour la connexion
- **firstName/lastName** : Nom et prénom de l'utilisateur
- **email** : Email optionnel de l'utilisateur
- **gender** : Genre (MALE, FEMALE, UNKNOWN)
- **userType** : Type d'utilisateur (CHILD, PARENT, TEACHER, ADMIN)
- **age** : Âge de l'utilisateur
- **grade** : Niveau scolaire
- **country/timezone** : Localisation géographique
- **preferences** : Préférences utilisateur en JSON
- **password** : Mot de passe (pour le MVP, valeur par défaut)
- **lastLoginAt** : Dernière connexion
- **currentSessionStartTime** : Début de la session actuelle
- **totalConnectionDurationMs** : Temps total de connexion de cet utilisateur
- **createdAt/updatedAt** : Dates de création et modification

#### **Relations**
- **account** : Relation many-to-one avec Account
- **profile** : Relation one-to-one avec UserProfile
- **activities** : Relation one-to-many avec Activity

---

### **3. Modèle UserProfile (Profil Utilisateur)**

#### **Description**
Contient les informations détaillées et les préférences d'apprentissage de chaque utilisateur.

#### **Structure complète**
```prisma
model UserProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  learningGoals         String[]
  preferredSubjects     String[]
  learningStyle         String?
  difficulty            String?
  sessionPreferences    Json?
  interests             String[]
  specialNeeds          String?
  customNotes           String?
  parentWishes          String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  userSession           UserSession @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Index pour les performances
  @@index([userId])
  @@index([learningGoals])
  @@index([preferredSubjects])
}
```

#### **Champs détaillés**
- **id** : Identifiant unique du profil (CUID)
- **userId** : Référence unique vers UserSession
- **learningGoals** : Objectifs d'apprentissage (tableau de strings)
- **preferredSubjects** : Matières préférées
- **learningStyle** : Style d'apprentissage préféré
- **difficulty** : Niveau de difficulté souhaité
- **sessionPreferences** : Préférences de session en JSON
- **interests** : Centres d'intérêt de l'utilisateur
- **specialNeeds** : Besoins éducatifs particuliers
- **customNotes** : Notes personnalisées
- **parentWishes** : Souhaits des parents
- **createdAt/updatedAt** : Dates de création et modification

#### **Relations**
- **userSession** : Relation one-to-one avec UserSession

---

### **4. Modèle Activity (Activité)**

#### **Description**
Enregistre toutes les activités et exercices effectués par les utilisateurs.

#### **Structure complète**
```prisma
model Activity {
  id          String   @id @default(cuid())
  userId      String
  domain      String   // maths, coding, etc.
  nodeKey     String   // maths.addition.1digit
  score       Int      // 0-100
  attempts    Int      @default(1)
  durationMs  BigInt  @default(0)
  createdAt   DateTime @default(now())

  // Relations
  userSession UserSession @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Index pour les performances
  @@index([userId])
  @@index([domain])
  @@index([nodeKey])
  @@index([createdAt])
  @@index([score])
}
```

#### **Champs détaillés**
- **id** : Identifiant unique de l'activité (CUID)
- **userId** : Référence vers UserSession
- **domain** : Domaine d'apprentissage (maths, coding, etc.)
- **nodeKey** : Clé hiérarchique de l'exercice
- **score** : Score obtenu (0-100)
- **attempts** : Nombre de tentatives
- **durationMs** : Durée de l'activité en millisecondes
- **createdAt** : Date de création de l'activité

#### **Relations**
- **userSession** : Relation many-to-one avec UserSession

---

### **5. Modèle BillingRecord (Enregistrement de Facturation)**

#### **Description**
Gère l'historique des facturations et des abonnements.

#### **Structure complète**
```prisma
model BillingRecord {
  id                String        @id @default(cuid())
  accountId         String
  amount            Decimal       @db.Decimal(10, 2)
  currency          String        @default("EUR")
  status            BillingStatus @default(PENDING)
  description       String?
  invoiceUrl        String?
  paidAt            DateTime?
  dueDate           DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // Relations
  account           Account       @relation(fields: [accountId], references: [id], onDelete: Cascade)

  // Index pour les performances
  @@index([accountId])
  @@index([status])
  @@index([createdAt])
  @@index([dueDate])
}
```

#### **Champs détaillés**
- **id** : Identifiant unique de l'enregistrement (CUID)
- **accountId** : Référence vers Account
- **amount** : Montant de la facture
- **currency** : Devise (par défaut EUR)
- **status** : Statut de la facture (PENDING, PAID, OVERDUE, CANCELLED)
- **description** : Description de la facture
- **invoiceUrl** : URL vers la facture PDF
- **paidAt** : Date de paiement
- **dueDate** : Date d'échéance
- **createdAt/updatedAt** : Dates de création et modification

#### **Relations**
- **account** : Relation many-to-one avec Account

---

## 🔤 ENUMS ET TYPES

### **SubscriptionType**
```prisma
enum SubscriptionType {
  FREE      // Compte gratuit avec limitations
  PRO       // Compte professionnel standard
  PRO_PLUS  // Compte professionnel premium
}
```

### **Gender**
```prisma
enum Gender {
  MALE     // Masculin
  FEMALE   // Féminin
  UNKNOWN  // Non spécifié
}
```

### **UserType**
```prisma
enum UserType {
  CHILD    // Enfant (utilisateur principal)
  PARENT   // Parent ou tuteur
  TEACHER  // Enseignant
  ADMIN    // Administrateur
}
```

### **BillingStatus**
```prisma
enum BillingStatus {
  PENDING   // En attente de paiement
  PAID      // Payé
  OVERDUE   // En retard
  CANCELLED // Annulé
}
```

---

## 🔗 RELATIONS ET CONTRAINTES

### **Diagramme des relations**
```
Account (1) ←→ (N) UserSession (1) ←→ (1) UserProfile
    ↓
    (1) ←→ (N) BillingRecord

UserSession (1) ←→ (N) Activity
```

### **Contraintes de clés étrangères**
- **UserSession.accountId** → **Account.id** (CASCADE DELETE)
- **UserProfile.userId** → **UserSession.id** (CASCADE DELETE)
- **Activity.userId** → **UserSession.id** (CASCADE DELETE)
- **BillingRecord.accountId** → **Account.id** (CASCADE DELETE)

### **Contraintes d'unicité**
- **Account.email** : Email unique par compte
- **UserSession.sessionId** : Session ID unique par utilisateur
- **UserProfile.userId** : Un profil par utilisateur

---

## 📈 INDEX ET PERFORMANCES

### **Index primaires**
- Tous les modèles ont un index primaire sur `id` (CUID)

### **Index secondaires**
```prisma
// Account
@@index([email])           // Recherche par email
@@index([subscriptionType]) // Filtrage par type d'abonnement
@@index([createdAt])       // Tri par date de création

// UserSession
@@index([sessionId])       // Connexion par session ID
@@index([accountId])       // Recherche par compte
@@index([userType])        // Filtrage par type d'utilisateur
@@index([createdAt])       // Tri par date de création
@@index([lastLoginAt])     // Tri par dernière connexion

// UserProfile
@@index([userId])          // Recherche par utilisateur
@@index([learningGoals])   // Recherche par objectifs
@@index([preferredSubjects]) // Recherche par matières

// Activity
@@index([userId])          // Activités par utilisateur
@@index([domain])          // Filtrage par domaine
@@index([nodeKey])         // Recherche par exercice
@@index([createdAt])       // Tri chronologique
@@index([score])           // Tri par score

// BillingRecord
@@index([accountId])       // Factures par compte
@@index([status])          // Filtrage par statut
@@index([createdAt])       // Tri chronologique
@@index([dueDate])         // Tri par échéance
```

---

## 🌱 SCRIPT DE SEEDING (seed-multi-user.ts)

### **Description**
Script de population de la base de données avec des comptes de test et des données d'exemple.

### **Fonctionnalités principales**
1. **Nettoyage** : Suppression de toutes les données existantes
2. **Comptes de test** : Création de comptes FREE, PRO et PRO_PLUS
3. **Sessions multiples** : Plusieurs utilisateurs par compte
4. **Données réalistes** : Activités et profils complets
5. **Comptes spécifiques** : Compte Patrick pour les tests

### **Structure des données de test**
```typescript
// Compte PRO_PLUS avec 3 sessions
const proPlusAccount = {
  email: "proplus@example.com",
  subscriptionType: "PRO_PLUS",
  maxSessions: 5,
  members: [
    { firstName: "Alice", lastName: "Dupont", userType: "CHILD", age: 6 },
    { firstName: "Marie", lastName: "Dupont", userType: "PARENT", age: 35 },
    { firstName: "Pierre", lastName: "Dupont", userType: "PARENT", age: 38 }
  ]
}

// Compte FREE avec 2 sessions
const freeAccount = {
  email: "free@example.com",
  subscriptionType: "FREE",
  maxSessions: 2,
  members: [
    { firstName: "Lucas", lastName: "Martin", userType: "CHILD", age: 5 },
    { firstName: "Sophie", lastName: "Martin", userType: "PARENT", age: 32 }
  ]
}

// Compte Patrick spécifique
const patrickAccount = {
  email: "patrick@example.com",
  subscriptionType: "PRO",
  maxSessions: 3,
  members: [
    { firstName: "Patrick", lastName: "NII", userType: "ADMIN", age: 30 }
  ]
}
```

### **Données d'activités**
```typescript
// Activités mathématiques
const mathActivities = [
  { domain: "maths", nodeKey: "maths.addition.1digit", score: 85, attempts: 2 },
  { domain: "maths", nodeKey: "maths.subtraction.1digit", score: 92, attempts: 1 },
  { domain: "maths", nodeKey: "maths.compare.1digit", score: 78, attempts: 3 }
]

// Activités de codage
const codingActivities = [
  { domain: "coding", nodeKey: "coding.logic.shapes", score: 88, attempts: 1 },
  { domain: "coding", nodeKey: "coding.sequence.basic", score: 75, attempts: 2 }
]
```

---

## 🔄 MIGRATIONS

### **Migration 001_multi_user_accounts**

#### **Description**
Migration initiale pour créer la structure multi-utilisateur complète.

#### **Contenu principal**
```sql
-- Création des types ENUM
CREATE TYPE "SubscriptionType" AS ENUM ('FREE', 'PRO', 'PRO_PLUS');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');
CREATE TYPE "UserType" AS ENUM ('CHILD', 'PARENT', 'TEACHER', 'ADMIN');
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- Création des tables
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscriptionType" "SubscriptionType" NOT NULL DEFAULT 'FREE',
    "maxSessions" INTEGER NOT NULL DEFAULT 1,
    "totalAccountConnectionDurationMs" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- ... autres tables et contraintes
```

---

## 🚀 COMMANDES PRISMA

### **Génération du client**
```bash
npm run db:generate
```
Génère le client Prisma TypeScript basé sur le schéma.

### **Synchronisation de la base**
```bash
npm run db:push
```
Synchronise le schéma avec la base de données (développement uniquement).

### **Migration de production**
```bash
npx prisma migrate dev --name init
```
Crée et applique une migration pour la production.

### **Reset de la base**
```bash
npx prisma migrate reset
```
Remet la base à zéro et réapplique toutes les migrations.

### **Seeding des données**
```bash
npm run db:seed
```
Exécute le script de population avec des données de test.

---

## 🔍 REQUÊTES OPTIMISÉES

### **Récupération du profil utilisateur complet**
```typescript
const userProfile = await prisma.userSession.findUnique({
  where: { sessionId: payload.sessionId },
  include: {
    account: true,
    profile: true,
    activities: {
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  }
});
```

### **Statistiques agrégées par domaine**
```typescript
const summary = await prisma.$queryRaw`
  SELECT 
    domain,
    AVG(score) as averageScore,
    COUNT(*) as totalActivities,
    SUM(durationMs) as totalDuration
  FROM "Activity"
  WHERE "userId" = ${userId}
  GROUP BY domain
  ORDER BY averageScore DESC
`;
```

### **Activités récentes avec informations utilisateur**
```typescript
const activities = await prisma.activity.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 50,
  include: {
    userSession: {
      select: {
        firstName: true,
        lastName: true
      }
    }
  }
});
```

---

## 🛡️ SÉCURITÉ ET VALIDATION

### **Contraintes de base de données**
- **CASCADE DELETE** : Suppression automatique des données liées
- **Contraintes d'unicité** : Prévention des doublons
- **Types stricts** : Validation des types de données

### **Validation Prisma**
- **Schéma strict** : Définition précise des modèles
- **Relations obligatoires** : Contraintes de référentiel
- **Types automatiques** : Génération TypeScript des types

### **Bonnes pratiques**
1. **Index appropriés** : Optimisation des requêtes fréquentes
2. **Relations bien définies** : Structure logique des données
3. **Migration sécurisée** : Gestion des changements de schéma
4. **Seeding contrôlé** : Données de test réalistes

---

## 📊 MONITORING ET MAINTENANCE

### **Métriques de performance**
- **Temps de requête** : Surveillance des requêtes lentes
- **Utilisation des index** : Vérification de l'efficacité
- **Taille des tables** : Suivi de la croissance des données

### **Maintenance préventive**
- **Nettoyage des données** : Suppression des anciennes activités
- **Optimisation des index** : Ajustement selon l'usage
- **Backup régulier** : Sauvegarde des données critiques

---

*Document créé le : 31 décembre 2025*  
*Version : 1.0*  
*Maintenu par : Équipe de développement Katiopa* 