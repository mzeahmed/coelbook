package middleware

import (
	"log/slog"
	"net/http"

	"github.com/mzeahmed/coelbook/internal/response"
)

// Recovery returns a middleware that recovers from panics raised by next,
// logs them and writes a generic 500 Internal Server Error JSON response
// instead of letting the panic crash the server, using slog.Default().
//
// Use RecoveryWith to supply a specific *slog.Logger instead.
func Recovery(next http.Handler) http.Handler {
	return RecoveryWith(slog.Default())(next)
}

// RecoveryWith returns a middleware constructor that recovers from panics
// raised by next, logging them as a structured slog record instead of
// letting the panic crash the server.
func RecoveryWith(logger *slog.Logger) func(http.Handler) http.Handler {

	return func(next http.Handler) http.Handler {

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			defer func() {

				if err := recover(); err != nil {

					logger.Error("panic",
						"error", err,
						"method", r.Method,
						"path", r.URL.Path,
					)

					response.Error(w, http.StatusInternalServerError, "internal server error")
				}

			}()

			next.ServeHTTP(w, r)

		})
	}
}
