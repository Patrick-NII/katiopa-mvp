-- Migration pour ajouter la table BubixAnalysis
-- Créée le: $(date)

-- Créer la table BubixAnalysis
CREATE TABLE "BubixAnalysis" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BubixAnalysis_pkey" PRIMARY KEY ("id")
);

-- Créer les index pour optimiser les requêtes
CREATE INDEX "BubixAnalysis_childId_competence_createdAt_idx" ON "BubixAnalysis"("childId", "competence", "createdAt");
CREATE INDEX "BubixAnalysis_childId_createdAt_idx" ON "BubixAnalysis"("childId", "createdAt");

-- Ajouter un commentaire sur la table
COMMENT ON TABLE "BubixAnalysis" IS 'Stockage des analyses pédagogiques générées par Bubix via OpenAI';
COMMENT ON COLUMN "BubixAnalysis"."childId" IS 'ID de la session enfant';
COMMENT ON COLUMN "BubixAnalysis"."competence" IS 'Nom de la compétence analysée (ex: mathematiques, communication)';
COMMENT ON COLUMN "BubixAnalysis"."analysis" IS 'Analyse pédagogique générée par OpenAI';
COMMENT ON COLUMN "BubixAnalysis"."metadata" IS 'Métadonnées JSON (score, niveau, nom enfant, âge, etc.)';
COMMENT ON COLUMN "BubixAnalysis"."expiresAt" IS 'Date d\'expiration de l\'analyse (24h après création)';
