package types

import (
	"fmt"
	"regexp"
	"strings"
)

type Email struct {
	value string
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func NewEmail(email string) (Email, error) {
	email = strings.TrimSpace(strings.ToLower(email))

	if email == "" {
		return Email{}, fmt.Errorf("email cannot be empty")
	}

	if !emailRegex.MatchString(email) {
		return Email{}, fmt.Errorf("invalid email format: %s", email)
	}

	return Email{value: email}, nil
}

func (e Email) String() string {
	return e.value
}

func (e Email) Value() string {
	return e.value
}

type Password struct {
	hash string
}

func NewPasswordFromHash(hash string) Password {
	return Password{hash: hash}
}

func (p Password) Hash() string {
	return p.hash
}
