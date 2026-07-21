package middleware

import (
	"net/http"
	"strings"

	"github.com/mzeahmed/coelbook/internal/reqctx"
	"github.com/mzeahmed/coelbook/internal/response"
)

// TokenValidator is a function provided by the application to validate a
// raw token string (e.g. a JWT) and return the authenticated user's
// identity. The function should return a non-nil error if the token is
// missing, expired, or otherwise invalid.
type TokenValidator func(token string) (*reqctx.AuthUser, error)

// Authenticate returns a middleware that extracts a Bearer token from the
// Authorization header, validates it using the provided validator, and
// attaches the resulting AuthUser to the request context.
//
// Requests without a valid token are rejected with 401 before reaching
// next. On success, the authenticated user can be retrieved with
// reqctx.AuthUserFromContext.
//
// Usage:
//
//	authenticate := middleware.Authenticate(func(token string) (*reqctx.AuthUser, error) {
//	    claims, err := auth.ParseToken(secret, token)
//	    if err != nil {
//	        return nil, err
//	    }
//	    // convert claims to AuthUser...
//	    return &reqctx.AuthUser{ID: userID, Roles: roles}, nil
//	})
func Authenticate(validate TokenValidator) func(http.Handler) http.Handler {

	return func(next http.Handler) http.Handler {

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			token, ok := bearerToken(r)
			if !ok {
				response.Error(w, http.StatusUnauthorized, "missing bearer token")

				return
			}

			user, err := validate(token)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "invalid or expired token")

				return
			}

			ctx := reqctx.WithAuthUser(r.Context(), *user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// bearerToken extracts the token from an "Authorization: Bearer <token>"
// header.
func bearerToken(r *http.Request) (string, bool) {

	const prefix = "Bearer "

	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, prefix) {
		return "", false
	}

	token := strings.TrimSpace(strings.TrimPrefix(header, prefix))
	if token == "" {
		return "", false
	}

	return token, true
}
