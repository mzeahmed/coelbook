// Package auth handles login, password resets, JWT access tokens, and the
// signed-in user's own account.
//
// There is no public registration: the only account created outside of an
// authenticated session is the administrator created by the setup wizard
// (see internal/modules/wizard).
package auth

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mzeahmed/coelbook/internal/mailer"
	"github.com/mzeahmed/coelbook/internal/reqctx"
)

// Module wires together the auth module's dependencies and exposes its
// HTTP routes.
type Module struct {
	handler *Handler
	service *Service
}

// New builds an auth Module with its service and handler dependencies
// initialized.
func New(pool *pgxpool.Pool, jwtSecret string, sender mailer.Sender) *Module {
	service := NewService(pool, jwtSecret, sender)
	return &Module{handler: NewHandler(service), service: service}
}

// RegisterRoutes registers the auth module's routes on the given mux. The
// sign-in and password reset routes are public; the /account routes act
// on the signed-in user and require a valid access token (authenticate).
func (m *Module) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.HandleFunc("POST /auth/login", m.handler.Login)
	mux.HandleFunc("POST /auth/password-reset", m.handler.RequestPasswordReset)
	mux.HandleFunc("POST /auth/password-reset/confirm", m.handler.ConfirmPasswordReset)

	mux.Handle("GET /account", authenticate(http.HandlerFunc(m.handler.GetAccount)))
	mux.Handle("PUT /account", authenticate(http.HandlerFunc(m.handler.UpdateAccount)))
	mux.Handle("PUT /account/password", authenticate(http.HandlerFunc(m.handler.ChangePassword)))
}

// ValidateToken verifies an access token against the user's current session.
func (m *Module) ValidateToken(ctx context.Context, token string) (*reqctx.AuthUser, error) {
	userID, err := m.service.ValidateAccessToken(ctx, token)
	if err != nil {
		return nil, err
	}

	return &reqctx.AuthUser{ID: userID}, nil
}
