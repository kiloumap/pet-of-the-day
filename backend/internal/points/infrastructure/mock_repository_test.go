package infrastructure

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"pet-of-the-day/internal/points/domain"
)

func TestMockBehaviorRepository(t *testing.T) {
	repo := NewMockBehaviorRepository()

	behavior := domain.Behavior{
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

	repo.AddBehavior(behavior)

	t.Run("GetAll", func(t *testing.T) {
		behaviors, err := repo.GetAll(context.Background())
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if len(behaviors) != 1 {
			t.Errorf("Expected 1 behavior, got %d", len(behaviors))
		}
	})

	t.Run("GetBySpecies", func(t *testing.T) {
		behaviors, err := repo.GetBySpecies(context.Background(), domain.SpeciesDog)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if len(behaviors) != 1 {
			t.Errorf("Expected 1 behavior, got %d", len(behaviors))
		}
	})

	t.Run("GetByID", func(t *testing.T) {
		result, err := repo.GetByID(context.Background(), behavior.ID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if result == nil {
			t.Fatal("Expected behavior, got nil")
		}
		if result.ID != behavior.ID {
			t.Errorf("Expected ID %v, got %v", behavior.ID, result.ID)
		}
	})

	t.Run("GetByID not found", func(t *testing.T) {
		result, err := repo.GetByID(context.Background(), uuid.New())
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if result != nil {
			t.Error("Expected nil, got behavior")
		}
	})
}

func TestMockScoreEventRepository(t *testing.T) {
	repo := NewMockScoreEventRepository()

	event := domain.ScoreEvent{
		ID:         uuid.New(),
		PetID:      uuid.New(),
		BehaviorID: uuid.New(),
		GroupID:    uuid.New(),
		Points:     10,
		ActionDate: time.Now(),
	}

	t.Run("Create and GetByID", func(t *testing.T) {
		created, err := repo.Create(context.Background(), event)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if created.ID != event.ID {
			t.Errorf("Expected ID %v, got %v", event.ID, created.ID)
		}

		retrieved, err := repo.GetByID(context.Background(), event.ID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if retrieved == nil {
			t.Fatal("Expected event, got nil")
		}
		if retrieved.ID != event.ID {
			t.Errorf("Expected ID %v, got %v", event.ID, retrieved.ID)
		}
	})

	t.Run("GetByPetAndGroup", func(t *testing.T) {
		events, err := repo.GetByPetAndGroup(context.Background(), event.PetID, event.GroupID, 10)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if len(events) != 1 {
			t.Errorf("Expected 1 event, got %d", len(events))
		}
	})

	t.Run("GetTotalPointsByPetAndGroup", func(t *testing.T) {
		total, err := repo.GetTotalPointsByPetAndGroup(context.Background(), event.PetID, event.GroupID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if total != 10 {
			t.Errorf("Expected 10 points, got %d", total)
		}
	})

	t.Run("Delete", func(t *testing.T) {
		err := repo.Delete(context.Background(), event.ID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		retrieved, err := repo.GetByID(context.Background(), event.ID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if retrieved != nil {
			t.Error("Expected event to be deleted")
		}
	})
}

func TestMockPetAccessChecker(t *testing.T) {
	checker := NewMockPetAccessChecker()
	userID := uuid.New()
	petID := uuid.New()

	t.Run("No access by default", func(t *testing.T) {
		hasAccess, err := checker.HasPetAccess(context.Background(), userID, petID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if hasAccess {
			t.Error("Expected no access by default")
		}
	})

	t.Run("Set and check access", func(t *testing.T) {
		checker.SetAccess(userID, petID, true)
		hasAccess, err := checker.HasPetAccess(context.Background(), userID, petID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if !hasAccess {
			t.Error("Expected access after setting")
		}
	})
}

func TestMockGroupMembershipChecker(t *testing.T) {
	checker := NewMockGroupMembershipChecker()
	userID := uuid.New()
	groupID := uuid.New()

	t.Run("No membership by default", func(t *testing.T) {
		isMember, err := checker.IsGroupMember(context.Background(), userID, groupID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if isMember {
			t.Error("Expected no membership by default")
		}
	})

	t.Run("Set and check membership", func(t *testing.T) {
		checker.SetMembership(userID, groupID, true)
		isMember, err := checker.IsGroupMember(context.Background(), userID, groupID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if !isMember {
			t.Error("Expected membership after setting")
		}
	})
}

func TestMockScoreEventOwnerChecker(t *testing.T) {
	checker := NewMockScoreEventOwnerChecker()
	userID := uuid.New()
	eventID := uuid.New()

	t.Run("No ownership by default", func(t *testing.T) {
		isOwner, err := checker.IsScoreEventOwner(context.Background(), userID, eventID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if isOwner {
			t.Error("Expected no ownership by default")
		}
	})

	t.Run("Set and check ownership", func(t *testing.T) {
		checker.SetOwnership(userID, eventID, true)
		isOwner, err := checker.IsScoreEventOwner(context.Background(), userID, eventID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if !isOwner {
			t.Error("Expected ownership after setting")
		}
	})
}
