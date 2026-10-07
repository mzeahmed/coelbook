// Package router assembles the application's HTTP handler by wiring up the
// routes exposed by each module.
package router

import (
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mzeahmed/coelbook/internal/mailer"
	"github.com/mzeahmed/coelbook/internal/middleware"
	"github.com/mzeahmed/coelbook/internal/modules/auth"
	"github.com/mzeahmed/coelbook/internal/modules/health"
	"github.com/mzeahmed/coelbook/internal/modules/incident"
	"github.com/mzeahmed/coelbook/internal/modules/wizard"
)

// New builds and returns the application's top-level http.Handler, with all
// module routes registered on a fresh http.ServeMux.
//
// pool and jwtSecret are threaded through so modules that need database
// access or JWT validation can be registered here, e.g.:
//
//	health.New().RegisterRoutes(mux)
//	auth.New(pool, jwtSecret).RegisterRoutes(mux)
func New(pool *pgxpool.Pool, jwtSecret string, sender mailer.Sender, log *slog.Logger) http.Handler {
	mux := http.NewServeMux()

	// Shared by every module that requires a valid access token: extracts
	// the bearer token, validates it against jwtSecret, and attaches the
	// caller's identity to the request context.
	authModule := auth.New(pool, jwtSecret, sender)
	authenticate := middleware.Authenticate(authModule.ValidateToken)

	health.New().RegisterRoutes(mux)
	wizard.New(pool).RegisterRoutes(mux)
	authModule.RegisterRoutes(mux)
	incident.New(pool).RegisterRoutes(mux, authenticate)

	return middleware.NotFound(mux)
}
