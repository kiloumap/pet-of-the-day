package users

import (
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

func TestCreateUser(t *testing.T) {
	// Initialisation de sqlmock
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// Dépôt à tester
	repo := UserRepository{DB: db}

	// Données d'entrée
	user := &User{
		Name:         "Laurent",
		Nickname:     "Lolo",
		Email:        "laurent@example.com",
		PasswordHash: "hashed_password",
		BirthDate:    time.Date(1995, 5, 1, 0, 0, 0, 0, time.UTC),
	}

	// Simulation de la requête SQL
	mock.ExpectQuery(`INSERT INTO users`).
		WithArgs(
			user.Name, user.Nickname, user.Email, user.PasswordHash, user.BirthDate, nil, nil, nil,
		).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))

	// Appel de la fonction
	err = repo.Create(user)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 1, user.ID)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetUserByEmail(t *testing.T) {
	// Initialisation de sqlmock
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// Dépôt à tester
	repo := UserRepository{DB: db}

	// Simulation des données retournées par la requête
	mockUser := &User{
		ID:           1,
		Name:         "Laurent",
		Nickname:     "Lolo",
		Email:        "laurent@example.com",
		PasswordHash: "hashed_password",
		BirthDate:    time.Date(1995, 5, 1, 0, 0, 0, 0, time.UTC),
	}
	rows := sqlmock.NewRows([]string{"id", "name", "nickname", "email", "password_hash", "birth_date", "city", "country", "postal_code", "created_at", "updated_at"}).
		AddRow(
			mockUser.ID,
			mockUser.Name,
			mockUser.Nickname,
			mockUser.Email,
			mockUser.PasswordHash,
			mockUser.BirthDate,
			nil, nil, nil,
			time.Now(), time.Now(),
		)

	mock.ExpectQuery(`SELECT .* FROM users WHERE email = .*`).
		WithArgs(mockUser.Email).
		WillReturnRows(rows)

	// Appel de la fonction
	result, err := repo.GetByEmail(mockUser.Email)

	// Assertions
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, mockUser.ID, result.ID)
	assert.Equal(t, mockUser.Name, result.Name)
	assert.NoError(t, mock.ExpectationsWereMet())
}
