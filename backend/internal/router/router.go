// Package router assembles the application's HTTP handler by wiring up the
// routes exposed by each module.
package router

import (
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mzeahmed/coelakit/module"

	"github.com/mzeahmed/playbook/internal/modules/health"
)

// New builds and returns the application's top-level http.Handler, with all
// module routes registered on a fresh http.ServeMux.
//
// pool and jwtSecret are threaded through so modules that need database
// access or JWT validation (auth, incident, ...) can be registered here as
// they're implemented, e.g.:
//
//	module.RegisterAll(mux,
//	    health.New(),
//	    auth.New(pool, jwtSecret),
//	)
func New(pool *pgxpool.Pool, jwtSecret string, log *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	//authenticate := auth.Authenticate(jwtSecret)

	module.RegisterAll(mux,
		health.New(),
	)

	return mux
}
