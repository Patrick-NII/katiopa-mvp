-- Migration: Transformation vers le système de comptes multi-utilisateurs
-- Date: 2024-08-27
-- Description: Refactorisation complète pour supporter les comptes avec plusieurs sessions utilisateur

-- 1. Créer les nouvelles tables
CREATE TYPE "SubscriptionType" AS ENUM ('FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');
CREATE TYPE "UserType" AS ENUM ('CHILD', 'PARENT', 'TEACHER', 'ADMIN');
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- Table des comptes principaux
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscriptionType" "SubscriptionType" NOT NULL DEFAULT 'FREE',
    "maxSessions" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- Table des sessions utilisateur
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "userType" "UserType" NOT NULL DEFAULT 'CHILD',
    "age" INTEGER,
    "grade" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "preferences" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- Table des profils utilisateur
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "learningGoals" TEXT[] NOT NULL DEFAULT '{}',
    "preferredSubjects" TEXT[] NOT NULL DEFAULT '{}',
    "learningStyle" TEXT,
    "difficulty" TEXT,
    "sessionPreferences" JSONB,
    "interests" TEXT[] NOT NULL DEFAULT '{}',
    "specialNeeds" TEXT[] NOT NULL DEFAULT '{}',
    "customNotes" TEXT,
    "parentWishes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- Table des activités (mise à jour)
CREATE TABLE "Activity_new" (
    "id" TEXT NOT NULL,
    "userSessionId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "nodeKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_new_pkey" PRIMARY KEY ("id")
);

-- Table de facturation
CREATE TABLE "BillingRecord" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "billingDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingRecord_pkey" PRIMARY KEY ("id")
);

-- 2. Créer les contraintes de clés étrangères
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity_new" ADD CONSTRAINT "Activity_new_userSessionId_fkey" FOREIGN KEY ("userSessionId") REFERENCES "UserSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Créer les index pour les performances
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "UserSession"("sessionId");
CREATE UNIQUE INDEX "UserProfile_userSessionId_key" ON "UserProfile"("userSessionId");
CREATE INDEX "UserSession_accountId_idx" ON "UserSession"("accountId");
CREATE INDEX "Activity_new_userSessionId_idx" ON "Activity_new"("userSessionId");
CREATE INDEX "BillingRecord_accountId_idx" ON "BillingRecord"("accountId");

-- 4. Migration des données existantes (si applicable)
-- Note: Cette partie doit être adaptée selon les données existantes

-- Exemple de migration pour un utilisateur existant :
-- INSERT INTO "Account" (id, email, subscriptionType, maxSessions, createdAt, updatedAt)
-- VALUES ('acc_001', 'user@example.com', 'FREE', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- INSERT INTO "UserSession" (id, accountId, sessionId, password, firstName, lastName, gender, userType, createdAt, updatedAt)
-- VALUES ('usr_001', 'acc_001', 'session_001', 'hashed_password', 'Prénom', 'Nom', 'UNKNOWN', 'CHILD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. Supprimer les anciennes tables (après vérification)
-- DROP TABLE IF EXISTS "Activity";
-- DROP TABLE IF EXISTS "User";
-- DROP TYPE IF EXISTS "Role";

-- 6. Renommer la nouvelle table d'activités
-- ALTER TABLE "Activity_new" RENAME TO "Activity";

-- 7. Vérifier les contraintes
-- SELECT * FROM information_schema.table_constraints WHERE table_name IN ('Account', 'UserSession', 'UserProfile', 'Activity', 'BillingRecord'); 