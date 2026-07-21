package auth

import "errors"

// ErrInvalidCredentials is returned when the email/password pair does not
// match a known, verifiable user.
var ErrInvalidCredentials = errors.New("invalid email or password")