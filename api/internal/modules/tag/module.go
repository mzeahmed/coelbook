// Package tag exposes read access to the tags incidents are labelled
// with.
package tag

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Module wires together the tag module's dependencies and exposes
// its HTTP routes.
type Module struct {
	handler *Handler
}

// New builds the tag Module, initializing its handler and service
// dependencies.
func New(pool *pgxpool.Pool) *Module {
	return &Module{
		handler: NewHandler(NewService(pool)),
	}
}

// RegisterRoutes registers the tag module's routes on the given mux.
// Every route requires a valid access token, applied via authenticate.
func (m *Module) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.Handle("GET /tags", authenticate(http.HandlerFunc(m.handler.List)))
}
