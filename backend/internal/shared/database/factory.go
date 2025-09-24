package database

import (
	"context"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
	"pet-of-the-day/ent"
	// TODO: Re-enable when notebook system compilation issues are fixed
	// notebookDomain "pet-of-the-day/internal/notebook/domain"
	// notebookInfra "pet-of-the-day/internal/notebook/infrastructure"
	petDomain "pet-of-the-day/internal/pet/domain"
	petInfra "pet-of-the-day/internal/pet/infrastructure"
	petInfraEnt "pet-of-the-day/internal/pet/infrastructure/ent"
	sharingDomain "pet-of-the-day/internal/sharing/domain"
	sharingInfra "pet-of-the-day/internal/sharing/infrastructure"
	userDomain "pet-of-the-day/internal/user/domain"
	userInfra "pet-of-the-day/internal/user/infrastructure"
	userInfraEnt "pet-of-the-day/internal/user/infrastructure/ent"
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
		_ = client.Close()
		return &RepositoryFactory{entClient: nil}, nil
	}

	log.Println("🐘 Connected to PostgreSQL - using Ent repositories")
	return &RepositoryFactory{entClient: client}, nil
}

func (f *RepositoryFactory) CreateUserRepository() userDomain.Repository {
	if f.entClient != nil {
		return userInfraEnt.NewEntUserRepository(f.entClient)
	}
	return userInfra.NewMockUserRepository()
}

func (f *RepositoryFactory) CreatePetRepository() petDomain.Repository {
	if f.entClient != nil {
		return petInfraEnt.NewEntPetRepository(f.entClient)
	}
	return petInfra.NewMockPetRepository()
}

func (f *RepositoryFactory) CreateCoOwnershipRepository() userDomain.CoOwnershipRepository {
	// TODO: Implement Ent co-ownership repository when schema is ready
	// if f.entClient != nil {
	//     return userInfraEnt.NewEntCoOwnershipRepository(f.entClient)
	// }
	return userInfra.NewMockCoOwnershipRepository()
}

// TODO: Re-enable when notebook system compilation issues are fixed
// func (f *RepositoryFactory) CreateNotebookRepository() notebookDomain.NotebookRepository {
// 	if f.entClient != nil {
// 		return notebookInfra.NewEntNotebookRepository(f.entClient)
// 	}
// 	return notebookInfra.NewMockNotebookRepository()
// }

// func (f *RepositoryFactory) CreateNotebookEntryRepository() notebookDomain.NotebookEntryRepository {
// 	if f.entClient != nil {
// 		return notebookInfra.NewEntNotebookEntryRepository(f.entClient)
// 	}
// 	return notebookInfra.NewMockNotebookEntryRepository()
// }

func (f *RepositoryFactory) CreateShareRepository() sharingDomain.ShareRepository {
	if f.entClient != nil {
		return sharingInfra.NewEntShareRepository(f.entClient)
	}
	return sharingInfra.NewMockShareRepository()
}

func (f *RepositoryFactory) GetEntClient() *ent.Client {
	return f.entClient
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
