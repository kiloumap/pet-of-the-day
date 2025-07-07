package commands

import (
	"context"
	"log"

	"pet-of-the-day/internal/shared/events"
	"pet-of-the-day/internal/shared/types"
	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

type LoginUser struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginUserResult struct {
	UserID uuid.UUID    `json:"user_id"`
	User   *domain.User `json:"-"`
}

type LoginUserHandler struct {
	userRepo domain.Repository
	eventBus events.Bus
}

func NewLoginUserHandler(userRepo domain.Repository, eventBus events.Bus) *LoginUserHandler {
	return &LoginUserHandler{
		userRepo: userRepo,
		eventBus: eventBus,
	}
}

func (h *LoginUserHandler) Handle(ctx context.Context, cmd LoginUser) (*LoginUserResult, error) {
	email, err := types.NewEmail(cmd.Email)
	if err != nil {
		return nil, domain.ErrUserInvalidEmail
	}

	user, err := h.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}

	if err := user.VerifyPassword(cmd.Password); err != nil {
		return nil, domain.ErrUserInvalidPassword
	}

	loginEvent := domain.NewUserLoggedInEvent(user.ID())
	if err := h.eventBus.Publish(ctx, loginEvent); err != nil {
		log.Printf("Failed to publish login event: %v", err)
	}

	return &LoginUserResult{
		UserID: user.ID(),
		User:   user,
	}, nil
}
