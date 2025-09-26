package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"pet-of-the-day/internal/community"
	communityhttp "pet-of-the-day/internal/community/interfaces/http"
	petsCommands "pet-of-the-day/internal/pet/application/commands"
	petQueries "pet-of-the-day/internal/pet/application/queries"
	pethttp "pet-of-the-day/internal/pet/interfaces/http"
	pointsCommands "pet-of-the-day/internal/points/application/commands"
	pointsQueries "pet-of-the-day/internal/points/application/queries"
	pointsServices "pet-of-the-day/internal/points/application/services"
	pointsinfra "pet-of-the-day/internal/points/infrastructure/ent"
	pointshttp "pet-of-the-day/internal/points/interfaces/http"
	pointsws "pet-of-the-day/internal/points/interfaces/websocket"
	"pet-of-the-day/internal/shared/auth"
	"pet-of-the-day/internal/shared/database"
	"pet-of-the-day/internal/shared/events"
	// TODO: Re-enable when notebook system compilation issues are fixed
	// notebookCommands "pet-of-the-day/internal/notebook/application/commands"
	// notebookQueries "pet-of-the-day/internal/notebook/application/queries"
	// notebookhttp "pet-of-the-day/internal/notebook/interfaces/http"
	sharingCommands "pet-of-the-day/internal/sharing/application/commands"
	sharingQueries "pet-of-the-day/internal/sharing/application/queries"
	sharingInfra "pet-of-the-day/internal/sharing/infrastructure"
	sharinghttp "pet-of-the-day/internal/sharing/interfaces/http"
	usersCommands "pet-of-the-day/internal/user/application/commands"
	userQueries "pet-of-the-day/internal/user/application/queries"
	userhttp "pet-of-the-day/internal/user/interfaces/http"
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
	coOwnershipRepo := repoFactory.CreateCoOwnershipRepository() // Will need to create this

	registerHandler := usersCommands.NewRegisterUserHandler(userRepo, eventBus)
	loginHandler := usersCommands.NewLoginUserHandler(userRepo, eventBus)
	getUserHandler := userQueries.NewGetUserByIDHandler(userRepo)

	// Co-ownership command handlers
	grantCoOwnershipHandler := usersCommands.NewGrantCoOwnershipHandler(userRepo, coOwnershipRepo, eventBus)
	acceptCoOwnershipHandler := usersCommands.NewAcceptCoOwnershipHandler(userRepo, coOwnershipRepo, eventBus)
	rejectCoOwnershipHandler := usersCommands.NewRejectCoOwnershipHandler(userRepo, coOwnershipRepo, eventBus)
	revokeCoOwnershipHandler := usersCommands.NewRevokeCoOwnershipHandler(userRepo, coOwnershipRepo, eventBus)

	// Co-ownership query handlers
	getCoOwnershipRequestsHandler := userQueries.NewGetCoOwnershipRequestsHandler(coOwnershipRepo)
	getPetCoOwnersHandler := userQueries.NewGetPetCoOwnersHandler(coOwnershipRepo)
	getCoOwnershipRequestHandler := userQueries.NewGetCoOwnershipRequestHandler(coOwnershipRepo)

	userController := userhttp.NewController(
		registerHandler,
		loginHandler,
		getUserHandler,
		grantCoOwnershipHandler,
		acceptCoOwnershipHandler,
		rejectCoOwnershipHandler,
		revokeCoOwnershipHandler,
		getCoOwnershipRequestsHandler,
		getPetCoOwnersHandler,
		getCoOwnershipRequestHandler,
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

	// Behavior logging system repositories
	behaviorRepo := pointsinfra.NewBehaviorRepository(repoFactory.GetEntClient())
	behaviorLogRepo := pointsinfra.NewBehaviorLogRepository(repoFactory.GetEntClient())
	dailyScoreRepo := pointsinfra.NewDailyScoreRepository(repoFactory.GetEntClient())
	petOfTheDayRepo := pointsinfra.NewPetOfTheDayRepository(repoFactory.GetEntClient())
	authRepo := pointsinfra.NewAuthorizationRepository(repoFactory.GetEntClient())
	userSettingsRepo := repoFactory.CreateUserSettingsRepository()

	// Legacy points system (maintain backward compatibility)
	scoreEventRepo := pointsinfra.NewScoreEventRepository(repoFactory.GetEntClient())
	petAccessChecker := pointsinfra.NewPetAccessChecker(repoFactory.GetEntClient())
	groupMembershipChecker := pointsinfra.NewGroupMembershipChecker(repoFactory.GetEntClient())
	scoreEventOwnerChecker := pointsinfra.NewScoreEventOwnerChecker(repoFactory.GetEntClient())

	// Application services
	rankingService := pointsServices.NewRankingService(
		dailyScoreRepo, petOfTheDayRepo, authRepo, userSettingsRepo,
	)

	// Behavior logging command handlers
	createBehaviorLogHandler := pointsCommands.NewCreateBehaviorLogHandler(
		behaviorLogRepo, behaviorRepo, dailyScoreRepo, authRepo, eventBus,
	)
	updateBehaviorLogHandler := pointsCommands.NewUpdateBehaviorLogHandler(
		behaviorLogRepo, authRepo, eventBus,
	)
	deleteBehaviorLogHandler := pointsCommands.NewDeleteBehaviorLogHandler(
		behaviorLogRepo, authRepo, eventBus,
	)

	// Behavior logging query handlers
	getBehaviorsHandler := pointsQueries.NewGetBehaviorsHandler(behaviorRepo)
	getBehaviorLogsHandler := pointsQueries.NewGetBehaviorLogsHandler(behaviorLogRepo, authRepo)
	getGroupRankingsHandler := pointsQueries.NewGetGroupRankingsHandler(rankingService, authRepo)
	getPetOfTheDayHandler := pointsQueries.NewGetPetOfTheDayHandler(rankingService, authRepo)
	getDailyScoreHandler := pointsQueries.NewGetDailyScoreHandler(dailyScoreRepo, authRepo)

	// Legacy points system handlers (maintain backward compatibility)
	createScoreEventHandler := pointsCommands.NewCreateScoreEventHandler(
		behaviorRepo, scoreEventRepo, petAccessChecker, groupMembershipChecker, eventBus,
	)
	deleteScoreEventHandler := pointsCommands.NewDeleteScoreEventHandler(
		scoreEventRepo, scoreEventOwnerChecker, eventBus,
	)
	getPetScoreEventsHandler := pointsQueries.NewGetPetScoreEventsHandler(scoreEventRepo)
	getGroupLeaderboardHandler := pointsQueries.NewGetGroupLeaderboardHandler(scoreEventRepo)
	getRecentActivitiesHandler := pointsQueries.NewGetRecentActivitiesHandler(scoreEventRepo)

	// Behavior controller (new system)
	behaviorController := pointshttp.NewBehaviorController(
		getBehaviorsHandler,
		getBehaviorLogsHandler,
		getGroupRankingsHandler,
		getPetOfTheDayHandler,
		getDailyScoreHandler,
		createBehaviorLogHandler,
		updateBehaviorLogHandler,
		deleteBehaviorLogHandler,
	)

	// WebSocket handler for real-time rankings
	rankingsWSHandler := pointsws.NewRankingsHandler(
		getGroupRankingsHandler,
		getPetOfTheDayHandler,
		eventBus,
	)

	// Legacy points controller (backward compatibility)
	pointsController := pointshttp.NewController(
		getBehaviorsHandler,
		createScoreEventHandler,
		deleteScoreEventHandler,
		getPetScoreEventsHandler,
		getGroupLeaderboardHandler,
		getRecentActivitiesHandler,
	)

	// Sharing system setup
	shareRepo := repoFactory.CreateShareRepository()
	resourceService := sharingInfra.NewEntResourceService(repoFactory.GetEntClient())
	createShareHandler := sharingCommands.NewCreateShareHandler(shareRepo, resourceService, eventBus)
	updateShareHandler := sharingCommands.NewUpdateShareHandler(shareRepo, eventBus)
	revokeShareHandler := sharingCommands.NewRevokeShareHandler(shareRepo, eventBus)
	getUserSharesHandler := sharingQueries.NewGetUserSharesHandler(shareRepo)
	getResourceSharesHandler := sharingQueries.NewGetResourceSharesHandler(shareRepo, resourceService)
	checkAccessHandler := sharingQueries.NewCheckAccessHandler(shareRepo, resourceService)

	sharingController := sharinghttp.NewSharingController(
		createShareHandler,
		updateShareHandler,
		revokeShareHandler,
		getUserSharesHandler,
		getResourceSharesHandler,
		checkAccessHandler,
	)

	// TODO: Notebook system setup - temporarily disabled due to compilation issues
	// notebookRepo := repoFactory.CreateNotebookRepository()
	// notebookEntryRepo := repoFactory.CreateNotebookEntryRepository()
	// createEntryHandler := notebookCommands.NewCreateNotebookEntryHandler(notebookRepo, notebookEntryRepo, eventBus)
	// updateEntryHandler := notebookCommands.NewUpdateNotebookEntryHandler(notebookEntryRepo, eventBus)
	// deleteEntryHandler := notebookCommands.NewDeleteNotebookEntryHandler(notebookEntryRepo, eventBus)
	// shareNotebookHandler := notebookCommands.NewShareNotebookHandler(shareRepo, notebookRepo, eventBus)
	// revokeNotebookShareHandler := notebookCommands.NewRevokeNotebookShareHandler(shareRepo, eventBus)
	// getEntriesHandler := notebookQueries.NewGetNotebookEntriesHandler(notebookEntryRepo)
	// getEntryHandler := notebookQueries.NewGetNotebookEntryHandler(notebookEntryRepo)
	// getSharedNotebooksHandler := notebookQueries.NewGetSharedNotebooksHandler(shareRepo, notebookRepo)
	// getNotebookSharingHandler := notebookQueries.NewGetNotebookSharingHandler(shareRepo)

	// notebookController := notebookhttp.NewNotebookController(
	//     createEntryHandler,
	//     updateEntryHandler,
	//     deleteEntryHandler,
	//     shareNotebookHandler,
	//     revokeNotebookShareHandler,
	//     getEntriesHandler,
	//     getEntryHandler,
	//     getSharedNotebooksHandler,
	//     getNotebookSharingHandler,
	// )

	communityService := community.NewCommunityService(eventBus, jwtService, repoFactory, scoreEventRepo)

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
	behaviorController.RegisterRoutes(router) // Behavior logging system
	// TODO: Re-enable when notebook system compilation issues are fixed
	// notebookController.RegisterRoutes(api, authMiddleware)
	sharingController.RegisterRoutes(api, authMiddleware)
	communityhttp.RegisterCommunityRoutes(api, communityService.HTTPHandlers, jwtService)

	// WebSocket routes for real-time updates
	router.HandleFunc("/ws/groups/{id}/rankings", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		groupIDStr := vars["id"]
		groupID, err := uuid.Parse(groupIDStr)
		if err != nil {
			http.Error(w, "Invalid group ID", http.StatusBadRequest)
			return
		}
		rankingsWSHandler.HandleConnection(w, r, groupID)
	})

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

	// Start daily reset job scheduler
	go startDailyResetScheduler(rankingService)

	log.Printf("🚀 Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// startDailyResetScheduler starts a background scheduler for daily Pet of the Day reset
func startDailyResetScheduler(rankingService *pointsServices.RankingService) {
	// Run daily at 9 PM UTC (can be configured via environment variable)
	resetTimeStr := getEnv("DAILY_RESET_TIME", "21:00")
	resetTime, err := time.Parse("15:04", resetTimeStr)
	if err != nil {
		log.Printf("Invalid DAILY_RESET_TIME format, using default 21:00: %v", err)
		resetTime, _ = time.Parse("15:04", "21:00")
	}

	log.Printf("📅 Daily reset scheduler started, will run at %s UTC daily", resetTime.Format("15:04"))

	ticker := time.NewTicker(1 * time.Minute) // Check every minute
	defer ticker.Stop()

	lastRunDate := ""

	for {
		select {
		case now := <-ticker.C:
			// Check if it's time to run the daily reset
			todayStr := now.UTC().Format("2006-01-02")
			currentTime := now.UTC().Format("15:04")

			// Only run once per day and only after the reset time
			if todayStr != lastRunDate && currentTime >= resetTime.Format("15:04") {
				log.Printf("🔄 Running daily reset for %s", todayStr)

				ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
				err := rankingService.ScheduleDailyReset(ctx)
				cancel()

				if err != nil {
					log.Printf("❌ Daily reset failed: %v", err)
				} else {
					log.Printf("✅ Daily reset completed successfully for %s", todayStr)
					lastRunDate = todayStr
				}
			}
		}
	}
}
