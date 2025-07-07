package queries

import (
	"context"

	"pet-of-the-day/internal/user/domain"

	"github.com/google/uuid"
)

type GetUserByID struct {
	UserID uuid.UUID
}

type UserView struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	CreatedAt string    `json:"created_at"`
}

type GetUserByIDHandler struct {
	userRepo domain.Repository
}

func NewGetUserByIDHandler(userRepo domain.Repository) *GetUserByIDHandler {
	return &GetUserByIDHandler{
		userRepo: userRepo,
	}
}

func (h *GetUserByIDHandler) Handle(ctx context.Context, query GetUserByID) (*UserView, error) {
	user, err := h.userRepo.FindByID(ctx, query.UserID)
	if err != nil {
		return nil, err
	}

	return &UserView{
		ID:        user.ID(),
		Email:     user.Email().String(),
		FirstName: user.FirstName(),
		LastName:  user.LastName(),
		CreatedAt: user.CreatedAt().Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}
