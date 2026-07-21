// Package auth handles user login, issuing JWT access tokens on success.
//
// There is no public registration: the only account created outside of an
// authenticated session is the administrator created by the setup wizard
// (see internal/modules/wizard).
package auth

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Module wires together the auth module's dependencies and exposes its
// HTTP routes.
type Module struct {
	handler *Handler
}

// New builds an auth Module with its service and handler dependencies
// initialized.
func New(pool *pgxpool.Pool, jwtSecret string) *Module {
	return &Module{
		handler: NewHandler(NewService(pool, jwtSecret)),
	}
}

// RegisterRoutes registers the auth module's routes on the given mux.
func (m *Module) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/auth/login", m.handler.Login)
}