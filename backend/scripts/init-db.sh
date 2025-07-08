#!/bin/bash init-db.sh
SELECT 'CREATE DATABASE pet_of_the_day'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pet_of_the_day')\gexec

\c pet_of_the_day;

DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pet_app_user') THEN
      CREATE ROLE pet_app_user LOGIN PASSWORD 'app_password';
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE pet_of_the_day TO pet_app_user;
GRANT ALL ON SCHEMA public TO pet_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pet_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pet_app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pet_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pet_app_user;