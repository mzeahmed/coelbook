// Package tag manages the tags incidents are labelled with.
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
	// Purging unused tags acts on the collection, not on a /tags/{slug}
	// path, so it can never collide with a tag (a tag may be named "unused").
	mux.Handle("DELETE /tags", authenticate(http.HandlerFunc(m.handler.PurgeUnused)))
	mux.Handle("PUT /tags/{slug}", authenticate(http.HandlerFunc(m.handler.Rename)))
	mux.Handle("DELETE /tags/{slug}", authenticate(http.HandlerFunc(m.handler.Delete)))
	mux.Handle("POST /tags/{slug}/merge", authenticate(http.HandlerFunc(m.handler.Merge)))
}
