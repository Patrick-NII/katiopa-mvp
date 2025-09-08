-- Création de l'utilisateur
CREATE USER katiopa_user WITH PASSWORD 'katiopa_password';

-- Création de la base de données
CREATE DATABASE katiopa_db;

-- Attribution des privilèges
GRANT ALL PRIVILEGES ON DATABASE katiopa_db TO katiopa_user;

-- Connexion à la base de données
\c katiopa_db;

-- Attribution des privilèges sur le schéma public
GRANT ALL ON SCHEMA public TO katiopa_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO katiopa_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO katiopa_user;



















