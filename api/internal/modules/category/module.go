// Package category exposes read access to the categories incidents are
// grouped by.
package category

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Module wires together the category module's dependencies and exposes
// its HTTP routes.
type Module struct {
	handler *Handler
}

// New builds the category Module, initializing its handler and service
// dependencies.
func New(pool *pgxpool.Pool) *Module {
	return &Module{
		handler: NewHandler(NewService(pool)),
	}
}

// RegisterRoutes registers the category module's routes on the given mux.
// Every route requires a valid access token, applied via authenticate.
func (m *Module) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.Handle("GET /categories", authenticate(http.HandlerFunc(m.handler.List)))
}
