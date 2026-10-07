// Package stats exposes the aggregated figures shown on the overview page.
package stats

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Module wires together the stats module's dependencies and exposes its
// HTTP routes.
type Module struct {
	handler *Handler
}

// New builds the stats Module, initializing its handler and service
// dependencies.
func New(pool *pgxpool.Pool) *Module {
	return &Module{
		handler: NewHandler(NewService(pool)),
	}
}

// RegisterRoutes registers the stats module's routes on the given mux.
// Every route requires a valid access token, applied via authenticate.
func (m *Module) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.Handle("GET /stats", authenticate(http.HandlerFunc(m.handler.Get)))
}
