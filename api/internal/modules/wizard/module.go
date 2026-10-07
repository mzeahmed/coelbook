// Package wizard exposes the first-time setup workflow: creating the
// administrator account and configuring the instance on first launch.
package wizard

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Module wires together the wizard module's dependencies and exposes its
// HTTP routes.
type Module struct {
	handler *Handler
}

// New builds a wizard Module with its handler and service dependencies
// initialized.
func New(pool *pgxpool.Pool) *Module {
	return &Module{
		handler: NewHandler(NewService(pool)),
	}
}

// RegisterRoutes registers the wizard module's routes on the given mux.
func (m *Module) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /setup/status", m.handler.Status)
	mux.HandleFunc("POST /setup", m.handler.Setup)
}
