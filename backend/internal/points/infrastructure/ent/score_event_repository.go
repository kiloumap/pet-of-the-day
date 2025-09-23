package ent

import (
	"context"
	"sort"
	"time"

	"github.com/google/uuid"
	"pet-of-the-day/ent"
	"pet-of-the-day/ent/group"
	"pet-of-the-day/ent/membership"
	"pet-of-the-day/ent/pet"
	"pet-of-the-day/ent/scoreevent"
	"pet-of-the-day/ent/user"
	"pet-of-the-day/internal/points/domain"
)

// ScoreEventRepository implements domain.ScoreEventRepository using Ent
type ScoreEventRepository struct {
	client *ent.Client
}

// NewScoreEventRepository creates a new ScoreEventRepository
func NewScoreEventRepository(client *ent.Client) *ScoreEventRepository {
	return &ScoreEventRepository{
		client: client,
	}
}

// Create creates a new score event
func (r *ScoreEventRepository) Create(ctx context.Context, event domain.ScoreEvent) (*domain.ScoreEvent, error) {
	scoreEventBuilder := r.client.ScoreEvent.Create().
		SetID(event.ID).
		SetPetID(event.PetID).
		SetBehaviorID(event.BehaviorID).
		SetGroupID(event.GroupID).
		SetRecordedByID(event.RecordedByID).
		SetPoints(event.Points).
		SetActionDate(event.ActionDate).
		SetRecordedAt(event.RecordedAt)

	if event.Comment != "" {
		scoreEventBuilder = scoreEventBuilder.SetComment(event.Comment)
	}

	createdEvent, err := scoreEventBuilder.Save(ctx)
	if err != nil {
		return nil, err
	}

	// Re-fetch with relations to get IDs
	eventWithRelations, err := r.client.ScoreEvent.Query().
		Where(scoreevent.ID(createdEvent.ID)).
		WithPet().
		WithBehavior().
		WithRecordedBy().
		Only(ctx)
	if err != nil {
		return nil, err
	}

	domainEvent := r.toDomainScoreEvent(eventWithRelations)
	return &domainEvent, nil
}

// GetByID returns a score event by ID
func (r *ScoreEventRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.ScoreEvent, error) {
	eventEnt, err := r.client.ScoreEvent.Query().
		Where(scoreevent.ID(id)).
		WithPet().
		WithBehavior().
		WithRecordedBy().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil
		}
		return nil, err
	}

	domainEvent := r.toDomainScoreEvent(eventEnt)
	return &domainEvent, nil
}

// GetByPetAndGroup returns score events for a specific pet in a group
func (r *ScoreEventRepository) GetByPetAndGroup(ctx context.Context, petID, groupID uuid.UUID, limit int) ([]domain.ScoreEvent, error) {
	events, err := r.client.ScoreEvent.Query().
		Where(
			scoreevent.HasPetWith(pet.ID(petID)),
			scoreevent.GroupID(groupID),
		).
		WithPet().
		WithBehavior().
		WithRecordedBy().
		Order(ent.Desc(scoreevent.FieldActionDate), ent.Desc(scoreevent.FieldRecordedAt)).
		Limit(limit).
		All(ctx)
	if err != nil {
		return nil, err
	}

	return r.toDomainScoreEvents(events), nil
}

// GetTotalPointsByPetAndGroup returns total points for a pet in a group
func (r *ScoreEventRepository) GetTotalPointsByPetAndGroup(ctx context.Context, petID, groupID uuid.UUID) (int, error) {
	totalPoints, err := r.client.ScoreEvent.Query().
		Where(
			scoreevent.HasPetWith(pet.ID(petID)),
			scoreevent.GroupID(groupID),
		).
		Aggregate(ent.Sum(scoreevent.FieldPoints)).
		Int(ctx)
	if err != nil {
		return 0, nil // Return 0 if no events found
	}

	return totalPoints, nil
}

// GetLeaderboardData returns leaderboard data for a group within a date range
func (r *ScoreEventRepository) GetLeaderboardData(ctx context.Context, groupID uuid.UUID, startDate, endDate time.Time) ([]domain.LeaderboardEntry, error) {
	events, err := r.client.ScoreEvent.Query().
		Where(
			scoreevent.GroupID(groupID),
			scoreevent.ActionDateGTE(startDate),
			scoreevent.ActionDateLT(endDate),
		).
		WithPet(func(pq *ent.PetQuery) {
			pq.WithOwner()
		}).
		All(ctx)
	if err != nil {
		return nil, err
	}

	// Aggregate by pet
	petStats := make(map[uuid.UUID]domain.LeaderboardEntry)
	for _, event := range events {
		if event.Edges.Pet == nil {
			continue
		}

		petID := event.Edges.Pet.ID
		if stats, exists := petStats[petID]; exists {
			stats.TotalPoints += event.Points
			stats.ActionCount++
			petStats[petID] = stats
		} else {
			ownerName := "Unknown"
			if event.Edges.Pet.Edges.Owner != nil {
				ownerName = event.Edges.Pet.Edges.Owner.FirstName + " " + event.Edges.Pet.Edges.Owner.LastName
			}

			petStats[petID] = domain.LeaderboardEntry{
				PetID:       petID,
				PetName:     event.Edges.Pet.Name,
				Species:     event.Edges.Pet.Species,
				OwnerName:   ownerName,
				TotalPoints: event.Points,
				ActionCount: 1,
			}
		}
	}

	// Convert to slice and sort by points (descending)
	var leaderboard []domain.LeaderboardEntry
	for _, stats := range petStats {
		leaderboard = append(leaderboard, stats)
	}

	sort.Slice(leaderboard, func(i, j int) bool {
		return leaderboard[i].TotalPoints > leaderboard[j].TotalPoints
	})

	return leaderboard, nil
}

// Delete deletes a score event by ID
func (r *ScoreEventRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.client.ScoreEvent.DeleteOneID(id).Exec(ctx)
}

// DeleteByGroupID deletes all score events for a specific group
func (r *ScoreEventRepository) DeleteByGroupID(ctx context.Context, groupID uuid.UUID) error {
	_, err := r.client.ScoreEvent.Delete().
		Where(scoreevent.GroupID(groupID)).
		Exec(ctx)
	return err
}

// GetRecentActivitiesForUser returns recent activities for groups the user is a member of
func (r *ScoreEventRepository) GetRecentActivitiesForUser(ctx context.Context, userID uuid.UUID, limit int) ([]domain.ActivityItem, error) {
	// First, get groups where the user is a member or creator
	groups, err := r.client.Group.Query().
		Where(
			group.Or(
				group.HasCreatorWith(user.ID(userID)),
				group.HasMembershipsWith(membership.HasUserWith(user.ID(userID))),
			),
		).
		All(ctx)
	if err != nil {
		return nil, err
	}

	if len(groups) == 0 {
		return []domain.ActivityItem{}, nil
	}

	// Extract group IDs
	groupIDs := make([]uuid.UUID, len(groups))
	for i, g := range groups {
		groupIDs[i] = g.ID
	}

	// Query score events for these groups
	events, err := r.client.ScoreEvent.Query().
		Where(scoreevent.GroupIDIn(groupIDs...)).
		WithPet().
		WithBehavior().
		WithRecordedBy().
		WithGroup().
		Order(ent.Desc(scoreevent.FieldRecordedAt)).
		Limit(limit).
		All(ctx)
	if err != nil {
		return nil, err
	}

	var activities []domain.ActivityItem
	for _, event := range events {
		activity := domain.ActivityItem{
			ID:           event.ID,
			PetID:        event.Edges.Pet.ID,
			PetName:      event.Edges.Pet.Name,
			BehaviorID:   event.Edges.Behavior.ID,
			BehaviorName: event.Edges.Behavior.Name,
			GroupID:      event.Edges.Group.ID,
			GroupName:    event.Edges.Group.Name,
			Points:       event.Points,
			Comment:      event.Comment,
			RecordedAt:   event.RecordedAt,
			ActionDate:   event.ActionDate,
			RecordedBy:   event.Edges.RecordedBy.ID,
		}
		activities = append(activities, activity)
	}

	return activities, nil
}

// toDomainScoreEvent converts an ent.ScoreEvent to domain.ScoreEvent
func (r *ScoreEventRepository) toDomainScoreEvent(se *ent.ScoreEvent) domain.ScoreEvent {
	// Extract IDs from edges
	var petID, behaviorID, recordedByID uuid.UUID

	if se.Edges.Pet != nil {
		petID = se.Edges.Pet.ID
	}
	if se.Edges.Behavior != nil {
		behaviorID = se.Edges.Behavior.ID
	}
	if se.Edges.RecordedBy != nil {
		recordedByID = se.Edges.RecordedBy.ID
	}

	return domain.ScoreEvent{
		ID:           se.ID,
		PetID:        petID,
		BehaviorID:   behaviorID,
		GroupID:      se.GroupID,
		RecordedByID: recordedByID,
		Points:       se.Points,
		Comment:      se.Comment,
		ActionDate:   se.ActionDate,
		RecordedAt:   se.RecordedAt,
	}
}

// toDomainScoreEvents converts a slice of ent.ScoreEvent to domain.ScoreEvent
func (r *ScoreEventRepository) toDomainScoreEvents(events []*ent.ScoreEvent) []domain.ScoreEvent {
	result := make([]domain.ScoreEvent, len(events))
	for i, e := range events {
		result[i] = r.toDomainScoreEvent(e)
	}
	return result
}
