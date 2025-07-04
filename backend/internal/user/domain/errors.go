package domain

import "errors"

var (
	ErrUserNotFound         = errors.New("user not found")
	ErrUserEmailAlreadyUsed = errors.New("email already in use")
	ErrUserInvalidPassword  = errors.New("invalid password")
	ErrUserInvalidName      = errors.New("invalid name")
	ErrUserInvalidEmail     = errors.New("invalid email")
)
