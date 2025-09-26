package queries

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
	"pet-of-the-day/internal/points/infrastructure"
	"pet-of-the-day/internal/points/infrastructure/mock"
)

func TestGetBehaviorsHandler_Handle(t *testing.T) {
	// Setup
	behaviorRepo := infrastructure.NewMockBehaviorRepository()
	authRepo := mock.NewMockAuthorizationRepository()
	handler := NewGetBehaviorsHandler(behaviorRepo, authRepo)

	// Test data
	behavior1 := domain.Behavior{
		ID:                 uuid.New(),
		Name:               "Sit",
		Description:        "Pet sits on command",
		Category:           domain.BehaviorCategoryTraining,
		PointValue:         5,
		MinIntervalMinutes: 30,
		Species:            domain.SpeciesDog,
		Icon:               "sit",
		IsActive:           true,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	behavior2 := domain.Behavior{
		ID:                 uuid.New(),
		Name:               "Fetch",
		Description:        "Pet fetches an object",
		Category:           domain.BehaviorCategoryPlay,
		PointValue:         10,
		MinIntervalMinutes: 15,
		Species:            domain.SpeciesBoth,
		Icon:               "fetch",
		IsActive:           true,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	behaviorRepo.AddBehavior(behavior1)
	behaviorRepo.AddBehavior(behavior2)

	query := &GetBehaviorsQuery{
		UserID: uuid.New(),
	}
	result, err := handler.Handle(context.Background(), query)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(result.Behaviors) != 2 {
		t.Errorf("Expected 2 behaviors, got %d", len(result.Behaviors))
	}
}

func TestGetBehaviorsHandler_HandleWithSpecies(t *testing.T) {
	// Setup
	behaviorRepo := infrastructure.NewMockBehaviorRepository()
	authRepo := mock.NewMockAuthorizationRepository()
	handler := NewGetBehaviorsHandler(behaviorRepo, authRepo)

	// Test data
	dogBehavior := domain.Behavior{
		ID:                 uuid.New(),
		Name:               "Sit",
		Description:        "Pet sits on command",
		Category:           domain.BehaviorCategoryTraining,
		PointValue:         5,
		MinIntervalMinutes: 30,
		Species:            domain.SpeciesDog,
		Icon:               "sit",
		IsActive:           true,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	catBehavior := domain.Behavior{
		ID:                 uuid.New(),
		Name:               "Purr",
		Description:        "Cat purrs contentedly",
		Category:           domain.BehaviorCategorySocial,
		PointValue:         3,
		MinIntervalMinutes: 60,
		Species:            domain.SpeciesCat,
		Icon:               "purr",
		IsActive:           true,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	bothBehavior := domain.Behavior{
		ID:                 uuid.New(),
		Name:               "Sleep",
		Description:        "Pet sleeps peacefully",
		Category:           domain.BehaviorCategoryPlay,
		PointValue:         1,
		MinIntervalMinutes: 240,
		Species:            domain.SpeciesBoth,
		Icon:               "sleep",
		IsActive:           true,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	behaviorRepo.AddBehavior(dogBehavior)
	behaviorRepo.AddBehavior(catBehavior)
	behaviorRepo.AddBehavior(bothBehavior)

	t.Run("Get dog behaviors", func(t *testing.T) {
		species := domain.SpeciesDog
		query := &GetBehaviorsQuery{
			UserID:  uuid.New(),
			Species: &species,
		}
		result, err := handler.Handle(context.Background(), query)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		// Should get dog and both behaviors
		if len(result.Behaviors) < 1 {
			t.Errorf("Expected at least 1 behavior, got %d", len(result.Behaviors))
		}
	})
}

