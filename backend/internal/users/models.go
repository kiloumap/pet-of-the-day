package users

import "time"

type User struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Nickname     string    `json:"nickname"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	BirthDate    time.Time `json:"birth_date"`
	City         *string   `json:"city"`
	Country      *string   `json:"country"`
	PostalCode   *string   `json:"postal_code"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
