// Package incident exposes read and write access to the knowledge base's incidents
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
	mux.Handle("POST /incidents", authenticate(http.HandlerFunc(m.handler.Create)))
	mux.Handle("GET /incidents/{slug}", authenticate(http.HandlerFunc(m.handler.Get)))
	mux.Handle("PUT /incidents/{slug}", authenticate(http.HandlerFunc(m.handler.Update)))
	mux.Handle("GET /incidents/{slug}/versions", authenticate(http.HandlerFunc(m.handler.ListVersions)))
	mux.Handle("GET /incidents/{slug}/versions/{version}", authenticate(http.HandlerFunc(m.handler.GetVersion)))
}
