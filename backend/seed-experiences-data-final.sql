-- Script final pour insérer des données de démonstration dans les tables d'expériences
-- Utilise les vrais IDs d'utilisateurs et de comptes existants

-- Insérer des messages d'accueil de démonstration avec de vrais IDs
INSERT INTO "WelcomeMessage" ("id", "userSessionId", "accountId", "messageType", "content", "isActive", "createdAt") VALUES
('welcome_1', 'cmf0ce8mx0001s1u4dycd6krd', 'cmf05scjw000013r3lgj3r0qf', 'DAILY_GREETING', 'Bonjour Patrick ! Prêt(e) pour une nouvelle journée d''apprentissage sur CubeAI ?', true, NOW()),
('welcome_2', 'cmf05scr1000213r31i3feuco', 'cmf05scjw000013r3lgj3r0qf', 'MOTIVATION', 'Rappel : Tu as accompli 3 exercices hier ! Continue sur cette lancée !', true, NOW());

-- Insérer des recommandations de démonstration avec de vrais IDs
INSERT INTO "Recommendation" ("id", "userSessionId", "accountId", "type", "targetId", "targetType", "score", "reason", "createdAt") VALUES
('rec_1', 'cmf0ce8mx0001s1u4dycd6krd', 'cmf05scjw000013r3lgj3r0qf', 'GAME', 'game_math_puzzle_1', 'game', 0.9, 'Basé sur tes préférences en mathématiques', NOW()),
('rec_2', 'cmf0ce8mx0001s1u4dycd6krd', 'cmf05scjw000013r3lgj3r0qf', 'EXERCISE', 'ex_math_add_1', 'exercise', 0.85, 'Pour renforcer tes compétences en addition', NOW()),
('rec_3', 'cmf05scr1000213r31i3feuco', 'cmf05scjw000013r3lgj3r0qf', 'GAME', 'game_french_story_1', 'game', 0.8, 'Pour améliorer ton français de manière ludique', NOW());

-- Message de confirmation
SELECT 'Données de démonstration finales insérées avec succès !' as message;
