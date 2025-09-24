package domain

import "errors"

var (
	ErrUserNotFound         = errors.New("user not found")
	ErrUserEmailAlreadyUsed = errors.New("email already in use")
	ErrUserInvalidPassword  = errors.New("invalid password")
	ErrUserInvalidName      = errors.New("invalid name")
	ErrUserInvalidEmail     = errors.New("invalid email")

	// Co-ownership errors
	ErrInvalidPetID         = errors.New("invalid pet ID")
	ErrInvalidUserID        = errors.New("invalid user ID")
	ErrInvalidCoOwnerID     = errors.New("invalid co-owner ID")
	ErrCannotCoOwnSelf      = errors.New("cannot grant co-ownership to yourself")
	ErrUserAlreadyCoOwner   = errors.New("user is already a co-owner")
	ErrCoOwnershipNotFound  = errors.New("co-ownership request not found")
	ErrCoOwnershipNotPending = errors.New("co-ownership request is not pending")
	ErrNotAuthorized        = errors.New("not authorized to perform this action")
)
