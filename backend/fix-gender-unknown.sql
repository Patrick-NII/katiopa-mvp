-- Migration pour corriger les genres UNKNOWN des comptes existants
-- Date: 2025-01-27
-- Description: Mise à jour des genres des comptes qui ont été créés avec UNKNOWN

-- Mise à jour des comptes spécifiques identifiés
UPDATE "UserSession" 
SET gender = 'MALE' 
WHERE sessionId IN ('patrick', 'milan123') 
  AND gender = 'UNKNOWN';

-- Vérification des résultats
SELECT sessionId, firstName, lastName, gender, userType 
FROM "UserSession" 
WHERE sessionId IN ('patrick', 'milan123');

-- Optionnel: Mise à jour générale basée sur les prénoms
-- (Décommentez si vous voulez une correction automatique basée sur les prénoms)

/*
-- Prénoms masculins courants
UPDATE "UserSession" 
SET gender = 'MALE' 
WHERE gender = 'UNKNOWN' 
  AND LOWER(firstName) IN (
    'patrick', 'milan', 'pierre', 'paul', 'jean', 'michel', 'alain', 'philippe', 
    'bernard', 'daniel', 'christophe', 'nicolas', 'olivier', 'laurent', 'thomas',
    'antoine', 'julien', 'sebastien', 'vincent', 'fabrice', 'david', 'eric',
    'aylon', 'aylan', 'aylan', 'aylan'
  );

-- Prénoms féminins courants
UPDATE "UserSession" 
SET gender = 'FEMALE' 
WHERE gender = 'UNKNOWN' 
  AND LOWER(firstName) IN (
    'sophie', 'marie', 'anne', 'catherine', 'isabelle', 'nathalie', 'patricia',
    'christine', 'sylvie', 'veronique', 'sandrine', 'stephanie', 'caroline',
    'julie', 'audrey', 'melanie', 'celine', 'emilie', 'jessica', 'laura',
    'charlotte', 'lea', 'manon', 'camille', 'oceane', 'lucie', 'clara'
  );
*/

-- Statistiques finales
SELECT 
  gender,
  COUNT(*) as count,
  STRING_AGG(sessionId, ', ') as sessions
FROM "UserSession" 
GROUP BY gender
ORDER BY gender;

