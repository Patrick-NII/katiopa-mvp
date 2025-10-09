-- 🎯 REQUÊTES SQL POUR EXPLORER LES MÉTRIQUES CUBEMATCH

-- ============================================================================
-- 1️⃣  SCORES RÉCENTS AVEC NOUVEAUX CHAMPS
-- ============================================================================
SELECT 
  username,
  score,
  level,
  initial_difficulty,
  final_difficulty,
  (final_difficulty - initial_difficulty) as progression_difficulte,
  flow_score,
  engagement_score_v2,
  accuracy_rate,
  total_moves,
  successful_moves,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as date_partie
FROM cubematch_scores
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 2️⃣  PROFILS COGNITIFS DÉTAILLÉS
-- ============================================================================
SELECT 
  username,
  score,
  level,
  cognitive_profile::json->'speedVsAccuracy' as profil_vitesse,
  cognitive_profile::json->'errorRecovery' as recuperation,
  cognitive_profile::json->'adaptability' as adaptabilite,
  cognitive_profile::json->'persistence' as persistence,
  flow_score,
  created_at
FROM cubematch_scores
WHERE cognitive_profile IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 3️⃣  RECOMMANDATIONS PERSONNALISÉES
-- ============================================================================
SELECT 
  username,
  score,
  level,
  recommendations::json->'focusAreas' as zones_a_travailler,
  recommendations::json->'suggestedDifficulty' as difficulte_suggeree,
  recommendations::json->'suggestedOperators' as operateurs_a_pratiquer,
  created_at
FROM cubematch_scores
WHERE recommendations IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 4️⃣  DISTRIBUTION ET PRÉCISION PAR OPÉRATEUR
-- ============================================================================
SELECT 
  username,
  operator_distribution::json->'ADD' as additions,
  operator_distribution::json->'SUB' as soustractions,
  operator_distribution::json->'MUL' as multiplications,
  operator_distribution::json->'DIV' as divisions,
  operator_accuracy::json->'ADD' as precision_add,
  operator_accuracy::json->'SUB' as precision_sub,
  operator_accuracy::json->'MUL' as precision_mul,
  operator_accuracy::json->'DIV' as precision_div,
  created_at
FROM cubematch_scores
WHERE operator_distribution IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 5️⃣  PROGRESSION DE DIFFICULTÉ (ARRAY)
-- ============================================================================
SELECT 
  username,
  score,
  initial_difficulty,
  final_difficulty,
  difficulty_progression,
  jsonb_array_length(difficulty_progression) as nombre_rounds,
  created_at
FROM cubematch_scores
WHERE difficulty_progression IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 6️⃣  STATISTIQUES GLOBALES
-- ============================================================================
SELECT 
  COUNT(*) as total_parties,
  ROUND(AVG(score), 2) as score_moyen,
  MAX(score) as meilleur_score,
  ROUND(AVG(final_difficulty::numeric), 2) as difficulte_moyenne,
  ROUND(AVG(flow_score), 2) as flow_moyen,
  ROUND(AVG(engagement_score_v2), 2) as engagement_moyen,
  ROUND(AVG(accuracy_rate), 2) as precision_moyenne,
  ROUND(AVG(total_moves), 2) as mouvements_moyens
FROM cubematch_scores
WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- 7️⃣  MEILLEURES PERFORMANCES (FLOW SCORE)
-- ============================================================================
SELECT 
  username,
  score,
  level,
  flow_score,
  engagement_score_v2,
  accuracy_rate,
  final_difficulty,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as date
FROM cubematch_scores
WHERE flow_score > 0
ORDER BY flow_score DESC
LIMIT 10;

-- ============================================================================
-- 8️⃣  ANALYSE PAR PROFIL COGNITIF
-- ============================================================================
SELECT 
  cognitive_profile::json->'speedVsAccuracy' as profil,
  COUNT(*) as nombre_sessions,
  ROUND(AVG(score), 2) as score_moyen,
  ROUND(AVG(flow_score), 2) as flow_moyen,
  ROUND(AVG(accuracy_rate), 2) as precision_moyenne
FROM cubematch_scores
WHERE cognitive_profile IS NOT NULL
GROUP BY cognitive_profile::json->'speedVsAccuracy'
ORDER BY nombre_sessions DESC;

-- ============================================================================
-- 9️⃣  UTILISATEURS AVEC MEILLEURE PROGRESSION
-- ============================================================================
SELECT 
  username,
  COUNT(*) as nombre_parties,
  ROUND(AVG(final_difficulty::numeric - initial_difficulty::numeric), 2) as progression_moyenne,
  MAX(final_difficulty) as difficulte_max_atteinte,
  ROUND(AVG(score), 2) as score_moyen,
  ROUND(AVG(flow_score), 2) as flow_moyen
FROM cubematch_scores
WHERE initial_difficulty IS NOT NULL
GROUP BY username
HAVING COUNT(*) >= 3
ORDER BY progression_moyenne DESC
LIMIT 10;

-- ============================================================================
-- 🔟 SÉRIES ET TENTATIVES DÉTAILLÉES
-- ============================================================================
SELECT 
  cs.username,
  cms.series_number,
  cms.operator_used,
  cms.target_value,
  cms.attempts,
  cms.correct_answers,
  cms.incorrect_answers,
  cms.timeout_count,
  ROUND(cms.series_accuracy::numeric, 2) as precision,
  cms.average_response_time_ms,
  cms.long_decompositions,
  TO_CHAR(cms.created_at, 'DD/MM/YYYY HH24:MI') as date
FROM cubematch_series cms
JOIN cubematch_scores cs ON cms.score_id = cs.id
ORDER BY cms.created_at DESC
LIMIT 20;

-- ============================================================================
-- DESCRIPTION DES NOUVEAUX CHAMPS
-- ============================================================================
/*
  initial_difficulty    : Difficulté de départ (0.8 - 3.5)
  final_difficulty      : Difficulté finale atteinte
  average_difficulty    : Difficulté moyenne sur la session
  difficulty_progression: Array JSON de l'évolution
  flow_score           : Score d'état de flow (0-100)
  engagement_score_v2  : Score d'engagement (0-100)
  cognitive_profile    : Profil cognitif JSON {
                           speedVsAccuracy, errorRecovery, 
                           adaptability, persistence
                         }
  operator_distribution: Nombre d'utilisations par opérateur
  operator_accuracy    : Précision par opérateur
  bubix_metrics        : Toutes les métriques pour l'IA
  recommendations      : Recommandations personnalisées
*/



