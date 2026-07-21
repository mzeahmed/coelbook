package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"

	repo "github.com/mzeahmed/playbook/internal/database/queries"
)

// tokenTTL is how long an issued access token remains valid.
const tokenTTL = 24 * time.Hour

// Claims are the custom JWT claims issued on successful login. The user ID
// is carried in the standard "sub" claim.
type Claims struct {
	jwt.RegisteredClaims
}

// generateToken issues a signed JWT for the given user.
func generateToken(secret string, u repo.User) (string, error) {

	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.ID.String(),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenTTL)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(secret))
}

// ParseToken validates tokenString and returns its claims, or an error if
// the token is malformed, not signed with secret, or expired.
func ParseToken(secret, tokenString string) (*Claims, error) {

	claims := &Claims{}

	_, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	return claims, nil
}