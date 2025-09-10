-- Migration Prisma pour corriger les genres UNKNOWN
-- Ce fichier peut être exécuté avec: npx prisma db execute --file fix-gender-unknown.sql

-- 1. Correction des comptes spécifiques identifiés
UPDATE "UserSession" 
SET gender = 'MALE' 
WHERE sessionId IN ('patrick', 'milan123') 
  AND gender = 'UNKNOWN';

-- 2. Correction basée sur les prénoms connus
UPDATE "UserSession" 
SET gender = 'MALE' 
WHERE gender = 'UNKNOWN' 
  AND LOWER(firstName) IN (
    'patrick', 'milan', 'aylon', 'pierre', 'paul', 'jean', 'michel', 
    'alain', 'philippe', 'bernard', 'daniel', 'christophe', 'nicolas', 
    'olivier', 'laurent', 'thomas', 'antoine', 'julien', 'sebastien', 
    'vincent', 'fabrice', 'david', 'eric'
  );

UPDATE "UserSession" 
SET gender = 'FEMALE' 
WHERE gender = 'UNKNOWN' 
  AND LOWER(firstName) IN (
    'sophie', 'marie', 'anne', 'catherine', 'isabelle', 'nathalie', 
    'patricia', 'christine', 'sylvie', 'veronique', 'sandrine', 
    'stephanie', 'caroline', 'julie', 'audrey', 'melanie', 'celine', 
    'emilie', 'jessica', 'laura', 'charlotte', 'lea', 'manon', 
    'camille', 'oceane', 'lucie', 'clara'
  );

-- 3. Vérification des résultats
SELECT 
  sessionId, 
  firstName, 
  lastName, 
  gender, 
  userType,
  CASE 
    WHEN gender = 'UNKNOWN' THEN '⚠️ À vérifier manuellement'
    ELSE '✅ OK'
  END as status
FROM "UserSession" 
WHERE gender = 'UNKNOWN'
ORDER BY firstName;

-- 4. Statistiques finales
SELECT 
  gender,
  COUNT(*) as count,
  STRING_AGG(sessionId, ', ') as sessions
FROM "UserSession" 
GROUP BY gender
ORDER BY gender;

