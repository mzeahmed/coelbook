// Package settings manages the instance settings chosen in the setup
// wizard: its name, time zone and language.
package settings

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Module wires together the settings module's dependencies and exposes its
// HTTP routes.
type Module struct {
	handler *Handler
}

// New builds the settings Module, initializing its handler and service
// dependencies.
func New(pool *pgxpool.Pool) *Module {
	return &Module{
		handler: NewHandler(NewService(pool)),
	}
}

// RegisterRoutes registers the settings module's routes on the given mux.
// Every route requires a valid access token, applied via authenticate.
func (m *Module) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.Handle("GET /settings", authenticate(http.HandlerFunc(m.handler.Get)))
	mux.Handle("PUT /settings", authenticate(http.HandlerFunc(m.handler.Update)))
}
