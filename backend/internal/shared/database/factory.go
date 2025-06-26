package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"pet-of-the-day/ent"
	"pet-of-the-day/internal/user/domain"
	"pet-of-the-day/internal/user/infrastructure"

	_ "github.com/lib/pq"
)

type RepositoryFactory struct {
	entClient *ent.Client
}

func NewRepositoryFactory() (*RepositoryFactory, error) {
	// Check if we're in test mode
	if isTestMode() {
		log.Println("🧪 Test mode detected - using mock repositories")
		return &RepositoryFactory{entClient: nil}, nil
	}

	// Try to connect to database for dev/prod
	dbURL := getDatabaseURL()
	client, err := ent.Open("postgres", dbURL)
	if err != nil {
		log.Printf("❌ Failed to connect to database: %v", err)
		log.Println("🔄 Falling back to mock repositories")
		return &RepositoryFactory{entClient: nil}, nil
	}

	// Run migrations
	if err := client.Schema.Create(context.Background()); err != nil {
		log.Printf("⚠️  Migration failed: %v", err)
		client.Close()
		return &RepositoryFactory{entClient: nil}, nil
	}

	log.Println("🐘 Connected to PostgreSQL - using Ent repositories")
	return &RepositoryFactory{entClient: client}, nil
}

func (f *RepositoryFactory) CreateUserRepository() domain.Repository {
	if f.entClient != nil {
		return infrastructure.NewEntUserRepository(f.entClient)
	}
	return infrastructure.NewMockUserRepository()
}

func (f *RepositoryFactory) Close() error {
	if f.entClient != nil {
		return f.entClient.Close()
	}
	return nil
}

func isTestMode() bool {
	// Detect if we're running tests
	for _, arg := range os.Args {
		if arg == "-test.v" || arg == "-test.run" ||
			(len(arg) > 5 && arg[:5] == "-test") {
			return true
		}
	}

	// Check GO_ENV
	return os.Getenv("GO_ENV") == "test"
}

func getDatabaseURL() string {
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}

	// Default for development
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "secret")
	dbname := getEnv("DB_NAME", "pet_of_the_day")

	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, dbname)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
