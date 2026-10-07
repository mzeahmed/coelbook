// Package middleware provides HTTP middleware handlers shared across the
// application's router.
package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

// responseWriter wraps http.ResponseWriter to capture the status code
// written by the wrapped handler, so it can be included in the access log.
type responseWriter struct {
	http.ResponseWriter
	status int
}

// WriteHeader records the status code before delegating to the underlying
// http.ResponseWriter.
func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

// Logging returns a middleware that logs the method, path, status code and
// duration of every HTTP request handled by next, using slog.Default().
//
// Use LoggingWith to supply a specific *slog.Logger instead.
func Logging(next http.Handler) http.Handler {
	return LoggingWith(slog.Default())(next)
}

// LoggingWith returns a middleware constructor that logs every HTTP request
// handled by next as a structured slog record, with method, path, status
// and duration_ms as fields.
func LoggingWith(logger *slog.Logger) func(http.Handler) http.Handler {

	return func(next http.Handler) http.Handler {

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			start := time.Now()

			rw := &responseWriter{
				ResponseWriter: w,
				status:         http.StatusOK,
			}

			next.ServeHTTP(rw, r)

			logger.Info("request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", rw.status,
				"duration_ms", time.Since(start).Milliseconds(),
			)
		})
	}
}
