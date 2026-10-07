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

// PasswordResetRequest is the expected JSON body for a reset-email request.
type PasswordResetRequest struct {
	Email string `json:"email"`
}

// Validate checks that a reset-email request contains an address.
func (r PasswordResetRequest) Validate() error {
	if strings.TrimSpace(r.Email) == "" {
		return errors.New("email is required")
	}

	return nil
}

// PasswordResetConfirmRequest is the expected JSON body for setting a new
// password with a one-time reset token.
type PasswordResetConfirmRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

// Validate checks that the reset token and replacement password are usable.
func (r PasswordResetConfirmRequest) Validate() error {
	if strings.TrimSpace(r.Token) == "" {
		return errors.New("reset token is required")
	}
	if len(r.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}

	return nil
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
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// Response is returned on successful login.
type Response struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}
