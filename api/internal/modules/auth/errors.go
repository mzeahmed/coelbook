package auth

import "errors"

// ErrInvalidCredentials is returned when the email/password pair does not
// match a known, verifiable user.
var ErrInvalidCredentials = errors.New("invalid email or password")

// ErrInvalidResetToken is returned when a reset token is unknown, expired, or
// has already been used.
var ErrInvalidResetToken = errors.New("invalid or expired reset token")
