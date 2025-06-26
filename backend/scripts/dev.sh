#!/bin/bash

# Script de développement pour Pet of the Day
# Usage: ./dev.sh [start|stop|restart|logs|shell|migrate|test]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
SERVICE_API="api"
SERVICE_DB="db"

# Fonction d'aide
show_help() {
    echo "Pet of the Day - Development Helper"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      Show logs (add service name for specific logs)"
    echo "  shell     Open shell in API container"
    echo "  db        Open PostgreSQL shell"
    echo "  migrate   Run migrations"
    echo "  seed      Run database seeding"
    echo "  test      Run tests"
    echo "  build     Build containers"
    echo "  clean     Clean up containers and volumes"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs api"
    echo "  $0 shell"
    echo "  $0 migrate up"
}

# Vérifier si Docker et Docker Compose sont installés
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker not found${NC}"
        echo "Please install Docker first"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose not found${NC}"
        echo "Please install Docker Compose first"
        exit 1
    fi
}

# Fonction pour utiliser docker-compose ou docker compose
compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

# Attendre que l'API soit prête
wait_for_api() {
    echo -e "${YELLOW}Waiting for API to be ready...${NC}"

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            echo -e "${GREEN}API is ready!${NC}"
            return 0
        fi

        echo -e "${YELLOW}Attempt $attempt/$max_attempts - API not ready yet...${NC}"
        sleep 2
        ((attempt++))
    done

    echo -e "${RED}API failed to start after $max_attempts attempts${NC}"
    return 1
}

# Fonction principale
main() {
    check_dependencies

    case "${1:-}" in
        "start")
            echo -e "${YELLOW}Starting Pet of the Day services...${NC}"
            compose_cmd up -d
            wait_for_api
            echo -e "${GREEN}All services are running!${NC}"
            echo -e "${BLUE}API: http://localhost:8080${NC}"
            echo -e "${BLUE}Database: localhost:5432${NC}"
            ;;
        "stop")
            echo -e "${YELLOW}Stopping all services...${NC}"
            compose_cmd down
            echo -e "${GREEN}All services stopped!${NC}"
            ;;
        "restart")
            echo -e "${YELLOW}Restarting services...${NC}"
            compose_cmd restart
            wait_for_api
            echo -e "${GREEN}Services restarted!${NC}"
            ;;
        "logs")
            if [ -n "$2" ]; then
                echo -e "${YELLOW}Showing logs for $2...${NC}"
                compose_cmd logs -f "$2"
            else
                echo -e "${YELLOW}Showing logs for all services...${NC}"
                compose_cmd logs -f
            fi
            ;;
        "shell")
            echo -e "${YELLOW}Opening shell in API container...${NC}"
            compose_cmd exec $SERVICE_API /bin/bash
            ;;
        "db")
            echo -e "${YELLOW}Opening PostgreSQL shell...${NC}"
            compose_cmd exec $SERVICE_DB psql -U postgres -d pet_of_the_day
            ;;
        "migrate")
            shift
            echo -e "${YELLOW}Running migrations...${NC}"
            ./scripts/migrate.sh "$@"
            ;;
        "seed")
            echo -e "${YELLOW}Seeding database...${NC}"
            # Ici tu peux ajouter des données de test
            compose_cmd exec $SERVICE_API ./main seed 2>/dev/null || echo "Seeding not implemented yet"
            ;;
        "test")
            echo -e "${YELLOW}Running tests...${NC}"
            compose_cmd exec $SERVICE_API go test ./... -v
            ;;
        "build")
            echo -e "${YELLOW}Building containers...${NC}"
            compose_cmd build
            echo -e "${GREEN}Build completed!${NC}"
            ;;
        "clean")
            echo -e "${RED}Warning: This will remove all containers and volumes!${NC}"
            read -p "Are you sure? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                compose_cmd down -v --remove-orphans
                docker system prune -f
                echo -e "${GREEN}Cleanup completed!${NC}"
            fi
            ;;
        "status")
            echo -e "${YELLOW}Service status:${NC}"
            compose_cmd ps
            echo ""
            echo -e "${YELLOW}API Health:${NC}"
            if curl -s http://localhost:8080/health > /dev/null 2>&1; then
                echo -e "${GREEN}✓ API is healthy${NC}"
            else
                echo -e "${RED}✗ API is not responding${NC}"
            fi
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