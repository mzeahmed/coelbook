// Package router assembles the application's HTTP handler by wiring up the
// routes exposed by each module.
package router

import (
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mzeahmed/playbook/internal/middleware"
	"github.com/mzeahmed/playbook/internal/modules/auth"
	"github.com/mzeahmed/playbook/internal/modules/health"
	"github.com/mzeahmed/playbook/internal/modules/wizard"
)

// New builds and returns the application's top-level http.Handler, with all
// module routes registered on a fresh http.ServeMux.
//
// pool and jwtSecret are threaded through so modules that need database
// access or JWT validation can be registered here, e.g.:
//
//	health.New().RegisterRoutes(mux)
//	auth.New(pool, jwtSecret).RegisterRoutes(mux)
//
// Protecting a route with the issued JWT is then a matter of building a
// middleware.Authenticate validator around auth.ParseToken, as documented
// on middleware.Authenticate.
func New(pool *pgxpool.Pool, jwtSecret string, log *slog.Logger) http.Handler {
	mux := http.NewServeMux()

	health.New().RegisterRoutes(mux)
	wizard.New(pool).RegisterRoutes(mux)
	auth.New(pool, jwtSecret).RegisterRoutes(mux)

	return middleware.NotFound(mux)
}
