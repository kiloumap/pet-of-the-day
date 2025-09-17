#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.yml"
SERVICE_API="api"
SERVICE_API_DEV="api-dev"
SERVICE_DB="db"

show_help() {
    echo "Pet of the Day - Development Helper"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services (normal mode)"
    echo "  dev-watch Start all services with Air hot reload"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      Show logs (add service name for specific logs)"
    echo "  shell     Open shell in API container"
    echo "  db        Open PostgreSQL shell"
    echo "  build     Build containers"
    echo "  clean     Clean up containers and volumes"
    echo "  ent-gen   Generate Ent code inside container"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 dev-watch"
    echo "  $0 logs api-dev"
}

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

compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

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

main() {
    check_dependencies

    case "${1:-}" in
        "start")
            echo -e "${YELLOW}Starting Pet of the Day services (normal mode)...${NC}"
            compose_cmd --profile default up -d
            wait_for_api
            echo -e "${GREEN}All services are running!${NC}"
            echo -e "${BLUE}API: http://localhost:8080${NC}"
            echo -e "${BLUE}Database: localhost:5432${NC}"
            echo -e "${BLUE}Adminer: http://localhost:8082${NC}"
            ;;
        "dev-watch")
            echo -e "${YELLOW}Starting Pet of the Day services (dev-watch mode with Air)...${NC}"
            compose_cmd --profile dev-watch up -d
            echo -e "${GREEN}Services started with hot reload!${NC}"
            echo -e "${BLUE}API: http://localhost:8080 (with Air hot reload)${NC}"
            echo -e "${BLUE}Database: localhost:5432${NC}"
            echo -e "${BLUE}Adminer: http://localhost:8082${NC}"
            echo -e "${YELLOW}Edit your Go files and see changes instantly!${NC}"
            echo -e "${YELLOW}Use 'just logs api-dev' to see Air logs${NC}"
            ;;
        "stop")
            echo -e "${YELLOW}Stopping all services...${NC}"
            compose_cmd down
            echo -e "${GREEN}All services stopped!${NC}"
            ;;
        "restart")
            echo -e "${YELLOW}Restarting services...${NC}"
            compose_cmd restart
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
            if compose_cmd ps $SERVICE_API_DEV | grep -q "Up"; then
                compose_cmd exec $SERVICE_API_DEV /bin/bash
            else
                compose_cmd exec $SERVICE_API /bin/bash
            fi
            ;;
        "db")
            echo -e "${YELLOW}Opening PostgreSQL shell...${NC}"
            compose_cmd exec $SERVICE_DB psql -U postgres -d pet_of_the_day
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