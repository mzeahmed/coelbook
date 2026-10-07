package auth

import "github.com/mzeahmed/coelbook/internal/apperr"

// ErrInvalidCredentials is returned when the email/password pair does not
// match a known, verifiable user.
var ErrInvalidCredentials = apperr.New("invalid_credentials", "invalid email or password")

// ErrInvalidResetToken is returned when a reset token is unknown, expired, or
// has already been used.
var ErrInvalidResetToken = apperr.New("invalid_reset_token", "invalid or expired reset token")
