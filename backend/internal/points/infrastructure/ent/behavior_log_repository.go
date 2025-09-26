package ent

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"pet-of-the-day/ent"
	"pet-of-the-day/ent/behaviorlog"
	"pet-of-the-day/ent/behaviorloggroupshare"
	"pet-of-the-day/internal/points/domain"
)

// BehaviorLogRepository implements the domain.BehaviorLogRepository interface using Ent ORM
type BehaviorLogRepository struct {
	client *ent.Client
}

// NewBehaviorLogRepository creates a new Ent-based behavior log repository
func NewBehaviorLogRepository(client *ent.Client) *BehaviorLogRepository {
	return &BehaviorLogRepository{
		client: client,
	}
}

// Create creates a new behavior log with group shares
func (r *BehaviorLogRepository) Create(ctx context.Context, domainBehaviorLog *domain.BehaviorLog) error {
	// Start a transaction
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}

	// Create the behavior log
	_, err = tx.BehaviorLog.
		Create().
		SetID(domainBehaviorLog.ID).
		SetPetID(domainBehaviorLog.PetID).
		SetBehaviorID(domainBehaviorLog.BehaviorID).
		SetUserID(domainBehaviorLog.UserID).
		SetPointsAwarded(domainBehaviorLog.PointsAwarded).
		SetLoggedAt(domainBehaviorLog.LoggedAt).
		SetCreatedAt(domainBehaviorLog.CreatedAt).
		SetNotes(domainBehaviorLog.Notes).
		Save(ctx)

	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to create behavior log: %w", err)
	}

	// Create group shares
	for _, groupShare := range domainBehaviorLog.GroupShares {
		_, err := tx.BehaviorLogGroupShare.
			Create().
			SetID(groupShare.ID).
			SetBehaviorLogID(groupShare.BehaviorLogID).
			SetGroupID(groupShare.GroupID).
			SetCreatedAt(groupShare.CreatedAt).
			Save(ctx)

		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to create group share: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetByID retrieves a behavior log by ID with group shares
func (r *BehaviorLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.BehaviorLog, error) {
	entBehaviorLog, err := r.client.BehaviorLog.
		Query().
		Where(behaviorlog.ID(id)).
		WithGroupShares().
		First(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("behavior log not found")
		}
		return nil, fmt.Errorf("failed to get behavior log: %w", err)
	}

	return r.entToDomain(entBehaviorLog), nil
}

// Find retrieves behavior logs based on filter criteria
func (r *BehaviorLogRepository) Find(ctx context.Context, filter *domain.BehaviorLogFilter) ([]*domain.BehaviorLog, error) {
	query := r.client.BehaviorLog.Query().WithGroupShares()

	// Apply filters
	if filter.PetID != nil {
		query = query.Where(behaviorlog.PetID(*filter.PetID))
	}

	if filter.BehaviorID != nil {
		query = query.Where(behaviorlog.BehaviorID(*filter.BehaviorID))
	}

	if filter.UserID != nil {
		query = query.Where(behaviorlog.UserID(*filter.UserID))
	}

	if filter.DateFrom != nil {
		query = query.Where(behaviorlog.LoggedAtGTE(*filter.DateFrom))
	}

	if filter.DateTo != nil {
		query = query.Where(behaviorlog.LoggedAtLTE(*filter.DateTo))
	}

	if filter.GroupID != nil {
		// Join with group shares to filter by group
		query = query.Where(behaviorlog.HasGroupSharesWith(
			behaviorloggroupshare.GroupID(*filter.GroupID),
		))
	}

	// Apply pagination
	query = query.Limit(filter.Limit).Offset(filter.Offset)

	// Order by logged_at descending
	query = query.Order(ent.Desc(behaviorlog.FieldLoggedAt))

	entBehaviorLogs, err := query.All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to find behavior logs: %w", err)
	}

	behaviorLogs := make([]*domain.BehaviorLog, len(entBehaviorLogs))
	for i, entBehaviorLog := range entBehaviorLogs {
		behaviorLogs[i] = r.entToDomain(entBehaviorLog)
	}

	return behaviorLogs, nil
}

// Update updates an existing behavior log
func (r *BehaviorLogRepository) Update(ctx context.Context, domainBehaviorLog *domain.BehaviorLog) error {
	// Start a transaction
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}

	// Update the behavior log
	_, err = tx.BehaviorLog.
		UpdateOneID(domainBehaviorLog.ID).
		SetNotes(domainBehaviorLog.Notes).
		Save(ctx)

	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to update behavior log: %w", err)
	}

	// Delete existing group shares
	_, err = tx.BehaviorLogGroupShare.
		Delete().
		Where(behaviorloggroupshare.BehaviorLogID(domainBehaviorLog.ID)).
		Exec(ctx)

	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete existing group shares: %w", err)
	}

	// Create new group shares
	for _, groupShare := range domainBehaviorLog.GroupShares {
		_, err := tx.BehaviorLogGroupShare.
			Create().
			SetID(groupShare.ID).
			SetBehaviorLogID(groupShare.BehaviorLogID).
			SetGroupID(groupShare.GroupID).
			SetCreatedAt(groupShare.CreatedAt).
			Save(ctx)

		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to create group share: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// Delete deletes a behavior log (hard delete for data integrity)
func (r *BehaviorLogRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// Start a transaction
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}

	// Delete group shares first (foreign key constraint)
	_, err = tx.BehaviorLogGroupShare.
		Delete().
		Where(behaviorloggroupshare.BehaviorLogID(id)).
		Exec(ctx)

	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete group shares: %w", err)
	}

	// Delete the behavior log
	err = tx.BehaviorLog.DeleteOneID(id).Exec(ctx)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete behavior log: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetLastLoggedAt retrieves the most recent logged_at time for a specific pet and behavior
func (r *BehaviorLogRepository) GetLastLoggedAt(ctx context.Context, petID, behaviorID uuid.UUID) (*time.Time, error) {
	entBehaviorLog, err := r.client.BehaviorLog.
		Query().
		Where(
			behaviorlog.PetID(petID),
			behaviorlog.BehaviorID(behaviorID),
		).
		Order(ent.Desc(behaviorlog.FieldLoggedAt)).
		First(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil // No previous log found
		}
		return nil, fmt.Errorf("failed to get last logged time: %w", err)
	}

	return &entBehaviorLog.LoggedAt, nil
}

// GetBreakdown retrieves behavior breakdown for daily score calculation
func (r *BehaviorLogRepository) GetBreakdown(ctx context.Context, petID uuid.UUID, groupID uuid.UUID, date time.Time) ([]*domain.DailyScoreBreakdown, error) {
	// Calculate date boundaries (start and end of day)
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	// Query behavior logs with behavior details
	rows, err := r.client.BehaviorLog.
		Query().
		Where(
			behaviorlog.PetID(petID),
			behaviorlog.LoggedAtGTE(startOfDay),
			behaviorlog.LoggedAtLT(endOfDay),
			behaviorlog.HasGroupSharesWith(
				behaviorloggroupshare.GroupID(groupID),
			),
		).
		WithBehavior().
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get behavior breakdown: %w", err)
	}

	// Aggregate by behavior ID
	breakdown := make(map[uuid.UUID]*domain.DailyScoreBreakdown)

	for _, entBehaviorLog := range rows {
		behaviorID := entBehaviorLog.BehaviorID
		
		if existing, exists := breakdown[behaviorID]; exists {
			existing.Count++
			existing.TotalPoints += entBehaviorLog.PointsAwarded
		} else {
			behaviorName := "Unknown"
			behaviorCategory := domain.BehaviorCategoryPottyTraining
			
			if entBehaviorLog.Edges.Behavior != nil {
				behaviorName = entBehaviorLog.Edges.Behavior.Name
				behaviorCategory = domain.BehaviorCategory(entBehaviorLog.Edges.Behavior.Category)
			}

			breakdown[behaviorID] = &domain.DailyScoreBreakdown{
				BehaviorID:        behaviorID,
				BehaviorName:      behaviorName,
				BehaviorCategory:  behaviorCategory,
				Count:             1,
				PointsPerInstance: entBehaviorLog.PointsAwarded,
				TotalPoints:       entBehaviorLog.PointsAwarded,
			}
		}
	}

	// Convert map to slice
	result := make([]*domain.DailyScoreBreakdown, 0, len(breakdown))
	for _, item := range breakdown {
		result = append(result, item)
	}

	return result, nil
}

// CountByDateRange counts behavior logs within a date range
func (r *BehaviorLogRepository) CountByDateRange(ctx context.Context, petID uuid.UUID, from, to time.Time) (int, error) {
	count, err := r.client.BehaviorLog.
		Query().
		Where(
			behaviorlog.PetID(petID),
			behaviorlog.LoggedAtGTE(from),
			behaviorlog.LoggedAtLTE(to),
		).
		Count(ctx)

	if err != nil {
		return 0, fmt.Errorf("failed to count behavior logs: %w", err)
	}

	return count, nil
}

// GetByGroup retrieves all behavior logs shared with a specific group
func (r *BehaviorLogRepository) GetByGroup(ctx context.Context, groupID uuid.UUID, filter *domain.BehaviorLogFilter) ([]*domain.BehaviorLog, error) {
	// Add group filter to the existing filter
	if filter == nil {
		filter = domain.NewBehaviorLogFilter()
	}
	filter.GroupID = &groupID

	return r.Find(ctx, filter)
}

// CleanupOldLogs removes behavior logs older than the retention period (6 months)
func (r *BehaviorLogRepository) CleanupOldLogs(ctx context.Context, cutoffDate time.Time) (int, error) {
	// Start a transaction
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to start transaction: %w", err)
	}

	// Get behavior log IDs to delete
	oldLogs, err := tx.BehaviorLog.
		Query().
		Where(behaviorlog.CreatedAtLT(cutoffDate)).
		Select(behaviorlog.FieldID).
		All(ctx)

	if err != nil {
		tx.Rollback()
		return 0, fmt.Errorf("failed to get old logs: %w", err)
	}

	if len(oldLogs) == 0 {
		tx.Rollback()
		return 0, nil
	}

	// Extract IDs
	logIDs := make([]uuid.UUID, len(oldLogs))
	for i, log := range oldLogs {
		logIDs[i] = log.ID
	}

	// Delete group shares first
	_, err = tx.BehaviorLogGroupShare.
		Delete().
		Where(behaviorloggroupshare.BehaviorLogIDIn(logIDs...)).
		Exec(ctx)

	if err != nil {
		tx.Rollback()
		return 0, fmt.Errorf("failed to delete old group shares: %w", err)
	}

	// Delete behavior logs
	deletedCount, err := tx.BehaviorLog.
		Delete().
		Where(behaviorlog.IDIn(logIDs...)).
		Exec(ctx)

	if err != nil {
		tx.Rollback()
		return 0, fmt.Errorf("failed to delete old behavior logs: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return deletedCount, nil
}

// entToDomain converts an Ent behavior log entity to a domain behavior log
func (r *BehaviorLogRepository) entToDomain(entBehaviorLog *ent.BehaviorLog) *domain.BehaviorLog {
	domainBehaviorLog := &domain.BehaviorLog{
		ID:            entBehaviorLog.ID,
		PetID:         entBehaviorLog.PetID,
		BehaviorID:    entBehaviorLog.BehaviorID,
		UserID:        entBehaviorLog.UserID,
		PointsAwarded: entBehaviorLog.PointsAwarded,
		LoggedAt:      entBehaviorLog.LoggedAt,
		CreatedAt:     entBehaviorLog.CreatedAt,
		Notes:         entBehaviorLog.Notes,
		GroupShares:   make([]domain.BehaviorLogGroupShare, 0),
	}

	// Convert group shares
	if entBehaviorLog.Edges.GroupShares != nil {
		for _, entGroupShare := range entBehaviorLog.Edges.GroupShares {
			domainGroupShare := domain.BehaviorLogGroupShare{
				ID:            entGroupShare.ID,
				BehaviorLogID: entGroupShare.BehaviorLogID,
				GroupID:       entGroupShare.GroupID,
				CreatedAt:     entGroupShare.CreatedAt,
			}
			domainBehaviorLog.GroupShares = append(domainBehaviorLog.GroupShares, domainGroupShare)
		}
	}

	return domainBehaviorLog
}
