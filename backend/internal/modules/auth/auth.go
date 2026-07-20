// Package auth guards routes with a static bearer token check.
package auth

import (
	"net/http"
	"strings"

	"github.com/mzeahmed/coelakit/response"
)

const bearerPrefix = "Bearer "

// Authenticate returns a middleware that validates the
// "Authorization: Bearer <token>" header on incoming requests. Requests
// without a matching token are rejected with 401 before reaching next.
func Authenticate(token string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")

			if !strings.HasPrefix(header, bearerPrefix) || strings.TrimPrefix(header, bearerPrefix) != token {
				response.Error(w, http.StatusUnauthorized, "invalid or missing bearer token")

				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
