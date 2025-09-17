package domain

import "errors"

var (
	ErrGroupInvalidName        = errors.New("group name cannot be empty")
	ErrGroupInvalidDescription = errors.New("group description is invalid")
	ErrGroupNotFound           = errors.New("group not found")
	ErrGroupAlreadyExists      = errors.New("group already exists")
	ErrGroupUnauthorized       = errors.New("unauthorized to access group")

	ErrMembershipNotFound        = errors.New("membership not found")
	ErrMembershipAlreadyExists   = errors.New("membership already exists")
	ErrMembershipInvalidStatus   = errors.New("invalid membership status")
	ErrMembershipNoPets          = errors.New("membership must include at least one pet")
	ErrMembershipPetNotOwned     = errors.New("cannot add pet not owned by user")
	ErrMembershipAlreadyMember   = errors.New("user is already a member")
	ErrMembershipCannotLeave     = errors.New("group creator cannot leave group")

	ErrInvitationNotFound      = errors.New("invitation not found")
	ErrInvitationAlreadyExists = errors.New("invitation already exists")
	ErrInvitationExpired       = errors.New("invitation has expired")
	ErrInvitationInvalid       = errors.New("invitation is invalid")
)