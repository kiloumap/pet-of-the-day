-- Script d'initialisation de la base de données Pet of the Day
-- Ce script s'exécute au premier démarrage du container PostgreSQL

-- S'assurer que la base de données existe
SELECT 'CREATE DATABASE pet_of_the_day'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pet_of_the_day')\gexec

-- Se connecter à la base de données
\c pet_of_the_day;

-- Créer un utilisateur pour l'application si nécessaire
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pet_app_user') THEN
      CREATE ROLE pet_app_user LOGIN PASSWORD 'app_password';
   END IF;
END
$$;

-- Donner les permissions nécessaires
GRANT ALL PRIVILEGES ON DATABASE pet_of_the_day TO pet_app_user;
GRANT ALL ON SCHEMA public TO pet_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pet_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pet_app_user;

-- Définir les permissions par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pet_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pet_app_user;