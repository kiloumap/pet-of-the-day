package main

import (
	"log"
	"net/http"
	"os"

	petsCommands "pet-of-the-day/internal/pet/application/commands"
	petQueries "pet-of-the-day/internal/pet/application/queries"
	pethttp "pet-of-the-day/internal/pet/interfaces/http"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/database"
	"pet-of-the-day/internal/shared/events"
	usersCommands "pet-of-the-day/internal/user/application/commands"
	userQueries "pet-of-the-day/internal/user/application/queries"
	userhttp "pet-of-the-day/internal/user/interfaces/http"

	"github.com/gorilla/mux"
)

func main() {
	// Configuration
	jwtSecret := getEnv("JWT_SECRET", "your-super-secret-jwt-key")
	port := getEnv("PORT", "8080")

	// Repository Factory (auto-detects Mock vs Ent)
	repoFactory, err := database.NewRepositoryFactory()
	if err != nil {
		log.Fatalf("Failed to create repository factory: %v", err)
	}
	defer repoFactory.Close()

	// Shared services
	eventBus := events.NewInMemoryBus()
	jwtService := auth.NewJWTService(jwtSecret, "pet-of-the-day")
	authMiddleware := auth.JWTMiddleware(jwtService)

	// User bounded context (auto Mock/Ent)
	userRepo := repoFactory.CreateUserRepository()
	registerHandler := usersCommands.NewRegisterUserHandler(userRepo, eventBus)
	loginHandler := usersCommands.NewLoginUserHandler(userRepo, eventBus)
	getUserHandler := userQueries.NewGetUserByIDHandler(userRepo)

	userController := userhttp.NewController(
		registerHandler,
		loginHandler,
		getUserHandler,
		jwtService,
	)

	// Pet bounded context
	petRepo := repoFactory.CreatePetRepository()
	addPetHandler := petsCommands.NewAddPetHandler(petRepo, eventBus)
	getUserPetsHandler := petQueries.NewGetUserPetsHandler(petRepo)
	getPetByIdHandler := petQueries.NewGetPetByIDHandler(petRepo)

	petController := pethttp.NewPetController(
		addPetHandler,
		getUserPetsHandler,
		getPetByIdHandler,
	)

	// HTTP router setup
	router := mux.NewRouter()
	api := router.PathPrefix("/api").Subrouter()

	// Register user routes
	userController.RegisterRoutes(api, authMiddleware)
	petController.RegisterRoutes(api, authMiddleware)

	// Health check
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"pet-of-the-day"}`))
	}).Methods("GET")

	log.Printf("🚀 Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
