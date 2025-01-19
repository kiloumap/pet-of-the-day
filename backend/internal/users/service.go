package users

import (
	"github.com/golang-jwt/jwt/v4"
	"time"
)

var jwtSecret = []byte("your_secret_key")

func GenerateJWT(user *User) (string, error) {
	claims := jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}
