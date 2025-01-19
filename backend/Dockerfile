# Build stage
FROM golang:1.23-alpine

RUN apk add --no-cache bash curl \
    && curl -L https://github.com/golang-migrate/migrate/releases/download/v4.15.2/migrate.linux-amd64.tar.gz | tar -xz \
    && mv migrate /usr/local/bin/migrate \
    && echo "alias ll='ls -l'" >> ~/.bashrc
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main .

CMD ["/app/main"]

