package commands

import (
	"context"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/shared/types"
	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

type RegisterUser struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

type RegisterUserResult struct {
	UserID uuid.UUID    `json:"user_id"`
	User   *domain.User `json:"user"`
}

type RegisterUserHandler struct {
	userRepo domain.Repository
	eventBus events.Bus
}

func NewRegisterUserHandler(userRepo domain.Repository, eventBus events.Bus) *RegisterUserHandler {
	return &RegisterUserHandler{
		userRepo: userRepo,
		eventBus: eventBus,
	}
}

func (h *RegisterUserHandler) Handle(ctx context.Context, cmd RegisterUser) (*RegisterUserResult, error) {
	email, err := types.NewEmail(cmd.Email)
	if err != nil {
		return nil, domain.ErrInvalidEmail
	}

	exists, err := h.userRepo.ExistsByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if exists {
		return nil, domain.ErrEmailAlreadyUsed
	}

	user, err := domain.NewUser(email, cmd.Password, cmd.FirstName, cmd.LastName)
	if err != nil {
		return nil, err
	}

	if err := h.userRepo.Save(ctx, user); err != nil {
		return nil, err
	}

	for _, event := range user.DomainEvents() {
		if err := h.eventBus.Publish(ctx, event); err != nil {
			// Log error but don't fail the command
		}
	}

	return &RegisterUserResult{
		UserID: user.ID(),
		User:   user,
	}, nil
}
