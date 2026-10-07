// Package health exposes the liveness endpoint used to check that the
// application is up and responding to requests.
package health

import "net/http"

// Module wires together the health module's dependencies and exposes its
// HTTP routes.
type Module struct {
	handler *Handler
}

// New builds a health Module with its handler dependencies initialized.
func New() *Module {
	return &Module{
		handler: NewHandler(),
	}
}

// RegisterRoutes registers the health module's routes on the given mux.
func (m *Module) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", m.handler.Health)
}
