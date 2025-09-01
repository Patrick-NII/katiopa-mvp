-- Script pour insérer des données de démonstration dans les tables d'expériences
-- À exécuter après la création des tables

-- Insérer des jeux de démonstration
INSERT INTO "Game" ("id", "title", "description", "domain", "type", "difficulty", "estimatedTime", "minAge", "maxAge", "tags", "rating", "totalPlays", "completionRate", "updatedAt") VALUES
('game_math_puzzle_1', 'MathQuest: Addition Aventure', 'Aventure mathématique pour apprendre les additions', 'Mathématiques', 'ADVENTURE', 'EASY', 15, 6, 10, ARRAY['math', 'addition', 'aventure'], 4.5, 150, 85.5, NOW()),
('game_french_quiz_1', 'Quiz Français: Vocabulaire', 'Quiz interactif pour enrichir le vocabulaire', 'Français', 'QUIZ', 'MEDIUM', 20, 8, 12, ARRAY['français', 'vocabulaire', 'quiz'], 4.2, 120, 78.3, NOW()),
('game_science_sim_1', 'ScienceLab: Expériences', 'Simulation d''expériences scientifiques', 'Sciences', 'SIMULATION', 'HARD', 25, 10, 15, ARRAY['sciences', 'expériences', 'simulation'], 4.8, 80, 92.1, NOW()),
('game_math_memory_1', 'Memory Math: Tables de multiplication', 'Jeu de mémoire pour apprendre les tables', 'Mathématiques', 'MEMORY', 'MEDIUM', 18, 7, 11, ARRAY['math', 'multiplication', 'mémoire'], 4.6, 95, 88.9, NOW()),
('game_french_story_1', 'Histoires Français: Contes interactifs', 'Contes interactifs pour améliorer la lecture', 'Français', 'ADVENTURE', 'EASY', 22, 6, 9, ARRAY['français', 'lecture', 'contes'], 4.4, 110, 82.7, NOW()),
('game_science_puzzle_1', 'Science Puzzle: Écosystèmes', 'Puzzle pour comprendre les écosystèmes', 'Sciences', 'PUZZLE', 'MEDIUM', 20, 9, 13, ARRAY['sciences', 'écosystèmes', 'puzzle'], 4.3, 85, 79.2, NOW());

-- Insérer des exercices de démonstration
INSERT INTO "Exercise" ("id", "title", "description", "domain", "difficulty", "estimatedTime", "content", "tags", "rating", "totalAttempts", "successRate", "updatedAt") VALUES
('ex_math_add_1', 'Addition avec retenue', 'Exercices d''addition avec retenue pour débutants', 'Mathématiques', 'EASY', 15, '{"questions": [{"id": 1, "text": "25 + 17 = ?", "answer": 42, "explanation": "25 + 17 = 42 (retenue de 1)"}, {"id": 2, "text": "38 + 26 = ?", "answer": 64, "explanation": "38 + 26 = 64 (retenue de 1)"}]}', ARRAY['math', 'addition', 'retenue'], 4.3, 200, 82.5, NOW()),
('ex_french_gram_1', 'Conjugaison présent', 'Exercices de conjugaison au présent', 'Français', 'MEDIUM', 20, '{"questions": [{"id": 1, "text": "Conjuguer ''manger'' à la 1ère personne du pluriel", "answer": "nous mangeons", "explanation": "Au présent, nous mangeons"}, {"id": 2, "text": "Conjuguer ''finir'' à la 2ème personne du singulier", "answer": "tu finis", "explanation": "Au présent, tu finis"}]}', ARRAY['français', 'conjugaison', 'présent'], 4.1, 180, 75.8, NOW()),
('ex_science_log_1', 'Logique scientifique', 'Exercices de logique et raisonnement scientifique', 'Sciences', 'HARD', 25, '{"questions": [{"id": 1, "text": "Si A > B et B > C, alors A ? C", "answer": "A > C", "explanation": "Propriété transitive de l''ordre"}, {"id": 2, "text": "Quel est le contraire de ''chaud'' ?", "answer": "froid", "explanation": "Les contraires s''opposent"}]}', ARRAY['sciences', 'logique', 'raisonnement'], 4.6, 120, 88.9, NOW()),
('ex_math_mult_1', 'Tables de multiplication', 'Exercices sur les tables de multiplication', 'Mathématiques', 'MEDIUM', 18, '{"questions": [{"id": 1, "text": "7 x 8 = ?", "answer": 56, "explanation": "7 x 8 = 56"}, {"id": 2, "text": "9 x 6 = ?", "answer": 54, "explanation": "9 x 6 = 54"}]}', ARRAY['math', 'multiplication', 'tables'], 4.4, 160, 85.2, NOW()),
('ex_french_vocab_1', 'Vocabulaire des animaux', 'Apprentissage du vocabulaire des animaux', 'Français', 'EASY', 12, '{"questions": [{"id": 1, "text": "Quel animal fait ''miaou'' ?", "answer": "chat", "explanation": "Le chat fait miaou"}, {"id": 2, "text": "Quel animal fait ''ouaf'' ?", "answer": "chien", "explanation": "Le chien fait ouaf"}]}', ARRAY['français', 'vocabulaire', 'animaux'], 4.7, 140, 90.1, NOW()),
('ex_science_geo_1', 'Géographie de la France', 'Découverte des régions françaises', 'Sciences', 'MEDIUM', 22, '{"questions": [{"id": 1, "text": "Quelle est la capitale de la France ?", "answer": "Paris", "explanation": "Paris est la capitale de la France"}, {"id": 2, "text": "Quel fleuve traverse Paris ?", "answer": "Seine", "explanation": "La Seine traverse Paris"}]}', ARRAY['sciences', 'géographie', 'France'], 4.2, 95, 77.8, NOW());

-- Insérer des messages d'accueil de démonstration
INSERT INTO "WelcomeMessage" ("id", "userSessionId", "accountId", "messageType", "content", "isActive", "createdAt") VALUES
('welcome_1', 'clx1', 'clx1', 'DAILY_GREETING', 'Bonjour ! Prêt(e) pour une nouvelle journée d''apprentissage sur CubeAI ?', true, NOW()),
('welcome_2', 'clx1', 'clx1', 'MOTIVATION', 'Rappel : Tu as accompli 3 exercices hier ! Continue sur cette lancée !', true, NOW());

-- Insérer des recommandations de démonstration
INSERT INTO "Recommendation" ("id", "userSessionId", "accountId", "type", "targetId", "targetType", "score", "reason", "isActive", "createdAt") VALUES
('rec_1', 'clx1', 'clx1', 'GAME', 'game_math_puzzle_1', 'game', 0.9, 'Basé sur tes préférences en mathématiques', true, NOW()),
('rec_2', 'clx1', 'clx1', 'EXERCISE', 'ex_math_add_1', 'exercise', 0.85, 'Pour renforcer tes compétences en addition', true, NOW()),
('rec_3', 'clx1', 'clx1', 'GAME', 'game_french_story_1', 'game', 0.8, 'Pour améliorer ton français de manière ludique', true, NOW());

-- Message de confirmation
SELECT 'Données de démonstration insérées avec succès !' as message;
