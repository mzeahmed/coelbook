// Package incident exposes read access to the knowledge base's incidents
// (documented technical problems and their resolutions).
package incident

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Module wires together the incident module's dependencies and exposes
// its HTTP routes.
type Module struct {
	handler *Handler
}

// New builds the incident Module, initializing its handler and service
// dependencies.
func New(pool *pgxpool.Pool) *Module {
	return &Module{
		handler: NewHandler(NewService(pool)),
	}
}

// RegisterRoutes registers the incident module's routes on the given mux.
// Every route requires a valid access token, applied via authenticate.
func (m *Module) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.Handle("GET /incidents", authenticate(http.HandlerFunc(m.handler.List)))
}
