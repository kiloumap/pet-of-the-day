DB_URL := "postgres://postgres:secret@db:5432/pet_of_the_day?sslmode=disable"
MIGRATIONS_PATH := "./database/migrations"

start:
    go run server.go

graphql-generate:
    go run github.com/99designs/gqlgen generate

bash:
    docker run -it pet-of-the-day-api bash

migrate-create name:
    docker run --rm -v $(pwd)/database/migrations:/app/database/migrations \
    pet-of-the-day-api migrate create -ext sql -dir /app/database/migrations -seq {{name}}

migrate-up:
    docker-compose run --rm -v $(pwd)/database/migrations:/app/database/migrations \
    api migrate -path {{ MIGRATIONS_PATH }} -database "{{ DB_URL }}" up

migrate-down:
    docker-compose run --rm -v $(pwd)/database/migrations:/app/database/migrations \
    api migrate -path {{ MIGRATIONS_PATH }} -database "{{ DB_URL }}" down

test-init:
    go mod tidy
    go mod download

test:
    go test ./internal/users -v