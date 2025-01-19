package users

import (
	"database/sql"
	"errors"
)

type UserRepository struct {
	DB *sql.DB
}

func (r *UserRepository) Create(user *User) error {
	query := `INSERT INTO users 
              (name, nickname, email, password_hash, birth_date, city, country, postal_code, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id`
	err := r.DB.QueryRow(query,
		user.Name,
		user.Nickname,
		user.Email,
		user.PasswordHash,
		user.BirthDate,
		user.City,
		user.Country,
		user.PostalCode,
	).Scan(&user.ID)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserRepository) GetByEmail(email string) (*User, error) {
	query := `SELECT id, name, nickname, email, password_hash, birth_date, city, country, postal_code, created_at, updated_at
              FROM users WHERE email = $1`
	user := &User{}
	err := r.DB.QueryRow(query, email).Scan(
		&user.ID,
		&user.Name,
		&user.Nickname,
		&user.Email,
		&user.PasswordHash,
		&user.BirthDate,
		&user.City,
		&user.Country,
		&user.PostalCode,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}
