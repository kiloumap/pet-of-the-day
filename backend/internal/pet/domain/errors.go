package domain

import "errors"

var (
	ErrPetNotFound       = errors.New("pet not found")
	ErrPetInvalidName    = errors.New("invalid name")
	ErrPetInvalidSpecies = errors.New("invalid species")
	ErrPetAlreadyExist   = errors.New("pet already exist")
)
