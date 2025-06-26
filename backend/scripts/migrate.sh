#!/bin/bash

# Script de migration pour Pet of the Day
# Usage: ./migrate.sh [up|down|force|version] [version_number]

set -e

# Configuration par défaut
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-secret}
DB_NAME=${DB_NAME:-pet_of_the_day}

DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"

# Déterminer le chemin des migrations selon le contexte
if [ -d "./database/migrations" ]; then
    MIGRATIONS_PATH="./database/migrations"
elif [ -d "../database/migrations" ]; then
    MIGRATIONS_PATH="../database/migrations"
elif [ -d "database/migrations" ]; then
    MIGRATIONS_PATH="database/migrations"
else
    echo "❌ Dossier migrations non trouvé!"
    echo "Recherché dans:"
    echo "  - ./database/migrations"
    echo "  - ../database/migrations"
    echo "  - database/migrations"
    exit 1
fi

echo "📁 Utilisation du dossier: $MIGRATIONS_PATH"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
    echo "Usage: $0 [COMMAND] [VERSION]"
    echo ""
    echo "Commands:"
    echo "  up [N]        Apply all or N up migrations"
    echo "  down [N]      Apply all or N down migrations"
    echo "  drop          Drop everything inside database"
    echo "  force V       Set version V but don't run migration (ignores dirty state)"
    echo "  version       Print current migration version"
    echo "  create NAME   Create new migration files"
    echo ""
    echo "Examples:"
    echo "  $0 up               # Apply all pending migrations"
    echo "  $0 up 2             # Apply next 2 migrations"
    echo "  $0 down 1           # Rollback 1 migration"
    echo "  $0 force 001        # Force version to 001"
    echo "  $0 create add_users # Create new migration"
    echo ""
    echo "Environment variables:"
    echo "  DB_HOST     Database host (default: localhost)"
    echo "  DB_PORT     Database port (default: 5432)"
    echo "  DB_USER     Database user (default: postgres)"
    echo "  DB_PASSWORD Database password (default: secret)"
    echo "  DB_NAME     Database name (default: pet_of_the_day)"
}

# Vérifier si migrate est installé
check_migrate() {
    if ! command -v migrate &> /dev/null; then
        echo -e "${RED}Error: migrate CLI not found${NC}"
        echo "Install it with:"
        echo "  # macOS"
        echo "  brew install golang-migrate"
        echo "  # Linux"
        echo "  curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar xvz"
        echo "  sudo mv migrate /usr/local/bin/"
        exit 1
    fi
}

# Attendre que la base de données soit prête
wait_for_db() {
    echo -e "${YELLOW}Waiting for database to be ready...${NC}"

    while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
        sleep 1
    done

    echo -e "${GREEN}Database is ready!${NC}"
}

# Fonction principale
main() {
    check_migrate

    case "${1:-}" in
        "up")
            wait_for_db
            if [ -n "$2" ]; then
                echo -e "${YELLOW}Applying $2 migrations...${NC}"
                migrate -path "$MIGRATIONS_PATH" -database "$DATABASE_URL" up "$2"
            else
                echo -e "${YELLOW}Applying all pending migrations...${NC}"
                migrate -path "$MIGRATIONS_PATH" -database "$DATABASE_URL" up
            fi
            echo -e "${GREEN}Migrations completed!${NC}"
            ;;
        "down")
            wait_for_db
            if [ -n "$2" ]; then
                echo -e "${YELLOW}Rolling back $2 migrations...${NC}"
                migrate -path "$MIGRATIONS_PATH" -database "$DATABASE_URL" down "$2"
            else
                echo -e "${RED}Warning: This will rollback ALL migrations!${NC}"
                read -p "Are you sure? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    migrate -path "$MIGRATIONS_PATH" -database "$DATABASE_URL" down
                fi
            fi
            echo -e "${GREEN}Rollback completed!${NC}"
            ;;
        "drop")
            wait_for_db
            echo -e "${RED}Warning: This will drop everything in the database!${NC}"
            read -p "Are you sure? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                migrate -path "$MIGRATIONS_PATH" -database "$DATABASE_URL" drop
                echo -e "${GREEN}Database dropped!${NC}"
            fi
            ;;
        "force")
            if [ -z "$2" ]; then
                echo -e "${RED}Error: Version number required for force command${NC}"
                exit 1
            fi
            wait_for_db
            echo -e "${YELLOW}Forcing version to $2...${NC}"
            migrate -path "$MIGRATIONS_PATH" -database "$DATABASE_URL" force "$2"
            echo -e "${GREEN}Version forced to $2${NC}"
            ;;
        "version")
            wait_for_db
            echo -e "${YELLOW}Current migration version:${NC}"
            migrate -path "$MIGRATIONS_PATH" -database "$DATABASE_URL" version
            ;;
        "create")
            if [ -z "$2" ]; then
                echo -e "${RED}Error: Migration name required${NC}"
                echo "Usage: $0 create migration_name"
                exit 1
            fi
            echo -e "${YELLOW}Creating migration: $2${NC}"
            migrate create -ext sql -dir "$MIGRATIONS_PATH" -seq "$2"
            echo -e "${GREEN}Migration files created!${NC}"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}Error: Unknown command '${1:-}'${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"