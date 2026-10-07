// Package reqctx carries the identity of an authenticated caller through a
// request's context.Context.
//
// It deliberately has no dependency on any domain or JWT package, so it can
// be imported both by middleware (which validates tokens) and by domain
// handlers (which need the caller's identity) without creating import
// cycles.
package reqctx

import "context"

// contextKey is an unexported type to avoid collisions with context keys
// defined in other packages.
type contextKey int

const authUserKey contextKey = iota

// AuthUser is the identity extracted from a validated access token.
type AuthUser struct {
	ID    string
	Roles []string
}

// WithAuthUser returns a copy of ctx carrying u, retrievable later with
// AuthUserFromContext.
func WithAuthUser(ctx context.Context, u AuthUser) context.Context {
	return context.WithValue(ctx, authUserKey, u)
}

// AuthUserFromContext returns the AuthUser attached with WithAuthUser, if
// any.
func AuthUserFromContext(ctx context.Context) (AuthUser, bool) {
	u, ok := ctx.Value(authUserKey).(AuthUser)

	return u, ok
}
