package domain

import "errors"

var (
	ErrPetNotFound    = errors.New("pet not found")
	ErrInvalidName    = errors.New("invalid name")
	ErrInvalidSpecies = errors.New("invalid species")
	ErrAlreadyExist   = errors.New("pet already exist")
)
