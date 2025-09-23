package queries

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
	"pet-of-the-day/internal/points/infrastructure"
)

func TestGetBehaviorsHandler_GetAll(t *testing.T) {
	// Setup
	behaviorRepo := infrastructure.NewMockBehaviorRepository()
	handler := NewGetBehaviorsHandler(behaviorRepo)

	// Test data
	behavior1 := domain.Behavior{
		ID:       uuid.New(),
		Name:     "Sit",
		Points:   5,
		Species:  domain.SpeciesDog,
		IsGlobal: true,
	}
	behavior2 := domain.Behavior{
		ID:       uuid.New(),
		Name:     "Fetch",
		Points:   10,
		Species:  domain.SpeciesBoth,
		IsGlobal: true,
	}

	behaviorRepo.AddBehavior(behavior1)
	behaviorRepo.AddBehavior(behavior2)

	behaviors, err := handler.GetAll(context.Background())

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(behaviors) != 2 {
		t.Errorf("Expected 2 behaviors, got %d", len(behaviors))
	}
}

func TestGetBehaviorsHandler_GetBySpecies(t *testing.T) {
	// Setup
	behaviorRepo := infrastructure.NewMockBehaviorRepository()
	handler := NewGetBehaviorsHandler(behaviorRepo)

	// Test data
	dogBehavior := domain.Behavior{
		ID:       uuid.New(),
		Name:     "Sit",
		Points:   5,
		Species:  domain.SpeciesDog,
		IsGlobal: true,
	}
	catBehavior := domain.Behavior{
		ID:       uuid.New(),
		Name:     "Purr",
		Points:   3,
		Species:  domain.SpeciesCat,
		IsGlobal: true,
	}
	bothBehavior := domain.Behavior{
		ID:       uuid.New(),
		Name:     "Sleep",
		Points:   1,
		Species:  domain.SpeciesBoth,
		IsGlobal: true,
	}

	behaviorRepo.AddBehavior(dogBehavior)
	behaviorRepo.AddBehavior(catBehavior)
	behaviorRepo.AddBehavior(bothBehavior)

	t.Run("Get dog behaviors", func(t *testing.T) {
		behaviors, err := handler.GetBySpecies(context.Background(), "dog")

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		// Should get dog and both behaviors
		if len(behaviors) != 2 {
			t.Errorf("Expected 2 behaviors, got %d", len(behaviors))
		}
	})

	t.Run("Get cat behaviors", func(t *testing.T) {
		behaviors, err := handler.GetBySpecies(context.Background(), "cat")

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		// Should get cat and both behaviors
		if len(behaviors) != 2 {
			t.Errorf("Expected 2 behaviors, got %d", len(behaviors))
		}
	})

	t.Run("Invalid species", func(t *testing.T) {
		_, err := handler.GetBySpecies(context.Background(), "bird")

		if err == nil {
			t.Error("Expected error for invalid species")
		}
		if invalidSpeciesErr, ok := err.(*InvalidSpeciesError); !ok {
			t.Errorf("Expected InvalidSpeciesError, got %T", err)
		} else if invalidSpeciesErr.Species != "bird" {
			t.Errorf("Expected species 'bird', got %s", invalidSpeciesErr.Species)
		}
	})
}

func TestInvalidSpeciesError(t *testing.T) {
	err := &InvalidSpeciesError{Species: "bird"}
	expected := "invalid species: bird"
	if err.Error() != expected {
		t.Errorf("Expected '%s', got %s", expected, err.Error())
	}
}
