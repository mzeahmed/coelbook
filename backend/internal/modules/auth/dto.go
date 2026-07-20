package auth

import (
	"errors"
	"strings"
)

// LoginRequest is the expected JSON body of a login request.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Validate checks that the login request contains usable data.
func (r LoginRequest) Validate() error {

	if strings.TrimSpace(r.Email) == "" || strings.TrimSpace(r.Password) == "" {
		return errors.New("email and password are required")
	}

	return nil
}

// UserResponse is the public representation of a user, safe to return
// in HTTP responses.
type UserResponse struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// Response is returned by both registration and login on success.
type Response struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}
