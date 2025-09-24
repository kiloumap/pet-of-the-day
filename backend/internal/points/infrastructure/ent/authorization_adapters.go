package ent

import (
	"context"

	"github.com/google/uuid"
	"pet-of-the-day/ent"
	"pet-of-the-day/ent/group"
	"pet-of-the-day/ent/membership"
	"pet-of-the-day/ent/pet"
	"pet-of-the-day/ent/scoreevent"
	"pet-of-the-day/ent/user"
)

// PetAccessChecker implements domain.PetAccessChecker using Ent
type PetAccessChecker struct {
	client *ent.Client
}

// NewPetAccessChecker creates a new PetAccessChecker
func NewPetAccessChecker(client *ent.Client) *PetAccessChecker {
	return &PetAccessChecker{
		client: client,
	}
}

// HasPetAccess checks if a user has access to a pet (owner or co-owner)
func (c *PetAccessChecker) HasPetAccess(ctx context.Context, userID, petID uuid.UUID) (bool, error) {
	petEntity, err := c.client.Pet.Query().
		Where(pet.ID(petID)).
		WithOwner().
		// TODO: Add WithCoOwners() when schema is ready
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}

	// Check if user is owner
	if petEntity.Edges.Owner != nil && petEntity.Edges.Owner.ID == userID {
		return true, nil
	}

	// TODO: Check co-owners when schema is ready
	// for _, coOwner := range petEntity.Edges.CoOwners {
	//     if coOwner.ID == userID {
	//         return true, nil
	//     }
	// }

	return false, nil
}

// GroupMembershipChecker implements domain.GroupMembershipChecker using Ent
type GroupMembershipChecker struct {
	client *ent.Client
}

// NewGroupMembershipChecker creates a new GroupMembershipChecker
func NewGroupMembershipChecker(client *ent.Client) *GroupMembershipChecker {
	return &GroupMembershipChecker{
		client: client,
	}
}

// IsGroupMember checks if a user is a member of a group
func (c *GroupMembershipChecker) IsGroupMember(ctx context.Context, userID, groupID uuid.UUID) (bool, error) {
	count, err := c.client.Group.Query().
		Where(group.ID(groupID)).
		QueryMemberships().
		Where(membership.HasUserWith(user.ID(userID))).
		Count(ctx)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// ScoreEventOwnerChecker implements domain.ScoreEventOwnerChecker using Ent
type ScoreEventOwnerChecker struct {
	client *ent.Client
}

// NewScoreEventOwnerChecker creates a new ScoreEventOwnerChecker
func NewScoreEventOwnerChecker(client *ent.Client) *ScoreEventOwnerChecker {
	return &ScoreEventOwnerChecker{
		client: client,
	}
}

// IsScoreEventOwner checks if a user is the owner of a score event
func (c *ScoreEventOwnerChecker) IsScoreEventOwner(ctx context.Context, userID, eventID uuid.UUID) (bool, error) {
	event, err := c.client.ScoreEvent.Query().
		Where(scoreevent.ID(eventID)).
		WithRecordedBy().
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}

	return event.Edges.RecordedBy.ID == userID, nil
}
