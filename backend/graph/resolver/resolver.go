package resolver

import "pet-of-the-day/internal/users"

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	UserRepository *users.UserRepository
}
