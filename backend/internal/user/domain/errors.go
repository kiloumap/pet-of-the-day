package domain

import "errors"

var (
	ErrUserNotFound     = errors.New("user not found")
	ErrEmailAlreadyUsed = errors.New("email already in use")
	ErrInvalidPassword  = errors.New("invalid password")
	ErrInvalidName      = errors.New("invalid name")
	ErrInvalidEmail     = errors.New("invalid email")
)
