FROM golang:1.24-alpine AS builder

# Installer les dépendances système
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copier les fichiers de dépendances
COPY go.mod go.sum ./

# Télécharger et vérifier les dépendances
RUN go mod download && go mod verify

# Copier le code source
COPY . .

# Construire l'application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

# Image de production
FROM alpine:latest

# Installer les outils nécessaires
RUN apk --no-cache add ca-certificates curl bash postgresql-client \
    && curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar -xz \
    && mv migrate /usr/local/bin/migrate \
    && chmod +x /usr/local/bin/migrate

WORKDIR /root/

# Copier l'exécutable et les migrations
COPY --from=builder /app/main .
COPY --from=builder /app/database/migrations ./database/migrations

# Créer le script d'entrée
RUN cat > /entrypoint.sh << 'EOF'
#!/bin/bash
set -e

echo "Waiting for database..."
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready!"
echo "Running migrations..."
migrate -path ./database/migrations -database "postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable" up

echo "Starting application..."
exec ./main
EOF

# Rendre le script exécutable
RUN chmod +x /entrypoint.sh

# Exposer le port
EXPOSE 8080

# Point d'entrée
CMD ["/entrypoint.sh"]