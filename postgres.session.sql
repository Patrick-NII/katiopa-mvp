SELECT * FROM "cubematch_user_stats";


SELECT 
  ns.score,
  ns.game_mode,
  ns.total_rounds,
  ns.successful_rounds,
  us.first_name
FROM numeromagic_scores ns
JOIN "UserSession" us ON ns.user_id = us.id
ORDER BY ns.created_at DESC
LIMIT 1;