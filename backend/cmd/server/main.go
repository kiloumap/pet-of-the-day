package main

import (
	"github.com/rs/cors"
	"log"
	"net/http"
	"os"

	"pet-of-the-day/internal/community"
	communityhttp "pet-of-the-day/internal/community/interfaces/http"
	petsCommands "pet-of-the-day/internal/pet/application/commands"
	petQueries "pet-of-the-day/internal/pet/application/queries"
	pethttp "pet-of-the-day/internal/pet/interfaces/http"
	pointsCommands "pet-of-the-day/internal/points/application/commands"
	pointsQueries "pet-of-the-day/internal/points/application/queries"
	pointsinfra "pet-of-the-day/internal/points/infrastructure/ent"
	pointshttp "pet-of-the-day/internal/points/interfaces/http"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/database"
	"pet-of-the-day/internal/shared/events"
	usersCommands "pet-of-the-day/internal/user/application/commands"
	userQueries "pet-of-the-day/internal/user/application/queries"
	userhttp "pet-of-the-day/internal/user/interfaces/http"

	"github.com/gorilla/mux"
)

func main() {
	jwtSecret := getEnv("JWT_SECRET", "your-super-secret-jwt-key")
	port := getEnv("PORT", "8080")

	repoFactory, err := database.NewRepositoryFactory()
	if err != nil {
		log.Fatalf("Failed to create repository factory: %v", err)
	}
	defer func(repoFactory *database.RepositoryFactory) {
		_ = repoFactory.Close()
	}(repoFactory)

	eventBus := events.NewInMemoryBus()
	jwtService := auth.NewJWTService(jwtSecret, "pet-of-the-day")
	authMiddleware := jwtService.AuthMiddleware

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

	petRepo := repoFactory.CreatePetRepository()
	addPetHandler := petsCommands.NewAddPetHandler(petRepo, eventBus)
	updatePetHandler := petsCommands.NewUpdatePetHandler(petRepo, eventBus)
	deletePetHandler := petsCommands.NewDeletePetHandler(petRepo, eventBus)
	getUserPetsHandler := petQueries.NewGetOwnedPetsHandler(petRepo)
	getPetByIdHandler := petQueries.NewGetPetByIDHandler(petRepo)

	petController := pethttp.NewPetController(
		addPetHandler,
		updatePetHandler,
		deletePetHandler,
		getUserPetsHandler,
		getPetByIdHandler,
	)

	behaviorRepo := pointsinfra.NewBehaviorRepository(repoFactory.GetEntClient())
	scoreEventRepo := pointsinfra.NewScoreEventRepository(repoFactory.GetEntClient())
	petAccessChecker := pointsinfra.NewPetAccessChecker(repoFactory.GetEntClient())
	groupMembershipChecker := pointsinfra.NewGroupMembershipChecker(repoFactory.GetEntClient())
	scoreEventOwnerChecker := pointsinfra.NewScoreEventOwnerChecker(repoFactory.GetEntClient())

	getBehaviorsHandler := pointsQueries.NewGetBehaviorsHandler(behaviorRepo)
	createScoreEventHandler := pointsCommands.NewCreateScoreEventHandler(
		behaviorRepo, scoreEventRepo, petAccessChecker, groupMembershipChecker, eventBus,
	)
	deleteScoreEventHandler := pointsCommands.NewDeleteScoreEventHandler(
		scoreEventRepo, scoreEventOwnerChecker, eventBus,
	)
	getPetScoreEventsHandler := pointsQueries.NewGetPetScoreEventsHandler(scoreEventRepo)
	getGroupLeaderboardHandler := pointsQueries.NewGetGroupLeaderboardHandler(scoreEventRepo)

	pointsController := pointshttp.NewController(
		getBehaviorsHandler,
		createScoreEventHandler,
		deleteScoreEventHandler,
		getPetScoreEventsHandler,
		getGroupLeaderboardHandler,
	)

	communityService := community.NewCommunityService(eventBus, jwtService, repoFactory)

	router := mux.NewRouter()

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Allow all origins in development
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
			http.MethodOptions,
			http.MethodHead,
		},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"X-CSRF-Token",
			"X-Requested-With",
			"Origin",
			"Accept-Encoding",
			"Accept-Language",
			"Cache-Control",
		},
		ExposedHeaders:   []string{"*"},
		AllowCredentials: false,
		MaxAge:           300,
		Debug:            true,
	})

	router.Use(func(next http.Handler) http.Handler {
		return c.Handler(next)
	})

	api := router.PathPrefix("/api").Subrouter()

	userController.RegisterRoutes(api, authMiddleware)
	petController.RegisterRoutes(api, authMiddleware)
	pointsController.RegisterRoutes(api, authMiddleware)
	communityhttp.RegisterCommunityRoutes(api, communityService.HTTPHandlers, jwtService)

	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write([]byte(`{"status":"healthy","service":"pet-of-the-day"}`)); err != nil {
			log.Printf("Failed to write health check response: %v", err)
		}
	}).Methods("GET")

	api.PathPrefix("").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token, X-Requested-With, Origin")
			w.WriteHeader(http.StatusOK)
			return
		}
	}).Methods("OPTIONS")

	handler := router

	log.Printf("🚀 Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
