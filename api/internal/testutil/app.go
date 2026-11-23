package testutil

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mzeahmed/coelbook/internal/router"
)

const (
	jwtSecret = "integration-test-secret"

	// AdminEmail and AdminPassword are the credentials of the administrator
	// created by App.Setup.
	AdminEmail    = "admin@example.com"
	AdminPassword = "correct-horse-battery"
)

// App is a running instance of the API for one test: the real router on an
// httptest server, backed by its own migrated database.
type App struct {
	// Pool gives tests direct access to the database, to check state the
	// API doesn't expose or to arrange data.
	Pool *pgxpool.Pool

	// Mail records the emails the application sent.
	Mail *Mailbox

	server *httptest.Server
}

// NewApp starts an API instance for the calling test and stops it when the
// test ends. The test is skipped if TEST_DATABASE_URL is not set.
func NewApp(t testing.TB) *App {
	t.Helper()

	pool := NewPool(t)
	mail := &Mailbox{}

	handler := router.New(pool, jwtSecret, mail, slog.New(slog.NewTextHandler(io.Discard, nil)))
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)

	return &App{Pool: pool, Mail: mail, server: server}
}

// Response is an API response: the HTTP status and the standard envelope.
type Response struct {
	Status int

	Success bool
	// Error is the stable error code ("title_required", …), empty on success.
	Error   string
	Field   string
	Message string

	// Data is the envelope's data, decoded with Decode.
	Data json.RawMessage
}

// Decode unmarshals the response data into v.
func (r Response) Decode(t testing.TB, v any) {
	t.Helper()

	if err := json.Unmarshal(r.Data, v); err != nil {
		t.Fatalf("decode response data %s: %v", r.Data, err)
	}
}

// Do sends a request and returns the response. A non-empty token is sent as
// a bearer token; a non-nil body is sent as JSON. Paths are the API's own
// ("/incidents"), without the /api prefix the reverse proxy adds.
func (a *App) Do(t testing.TB, method, path, token string, body any) Response {
	t.Helper()

	var reader io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("encode request body: %v", err)
		}

		reader = bytes.NewReader(raw)
	}

	req, err := http.NewRequestWithContext(context.Background(), method, a.server.URL+path, reader)
	if err != nil {
		t.Fatalf("build request: %v", err)
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	res, err := a.server.Client().Do(req)
	if err != nil {
		t.Fatalf("%s %s: %v", method, path, err)
	}
	defer func() { _ = res.Body.Close() }()

	raw, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatalf("read response of %s %s: %v", method, path, err)
	}

	var env struct {
		Success bool            `json:"success"`
		Error   string          `json:"error"`
		Field   string          `json:"field"`
		Message string          `json:"message"`
		Data    json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(raw, &env); err != nil {
		t.Fatalf("%s %s returned %d, not an API envelope: %s", method, path, res.StatusCode, raw)
	}

	return Response{
		Status:  res.StatusCode,
		Success: env.Success,
		Error:   env.Error,
		Field:   env.Field,
		Message: env.Message,
		Data:    env.Data,
	}
}

// Setup completes the installation wizard, creating the administrator
// (AdminEmail / AdminPassword), and returns a token for them.
func (a *App) Setup(t testing.TB) string {
	t.Helper()

	res := a.Do(t, http.MethodPost, "/setup", "", map[string]any{
		"admin": map[string]string{
			"first_name": "Ada",
			"last_name":  "Admin",
			"email":      AdminEmail,
			"password":   AdminPassword,
		},
		"instance": map[string]string{
			"name":     "Test instance",
			"timezone": "UTC",
			"locale":   "fr",
		},
	})
	if res.Status != http.StatusCreated && res.Status != http.StatusOK {
		t.Fatalf("setup returned %d (%s): %s", res.Status, res.Error, res.Message)
	}

	return a.Login(t, AdminEmail, AdminPassword)
}

// Login signs in and returns the access token, failing the test if the
// credentials are refused.
func (a *App) Login(t testing.TB, email, password string) string {
	t.Helper()

	res := a.Do(t, http.MethodPost, "/auth/login", "", map[string]string{"email": email, "password": password})
	if res.Status != http.StatusOK {
		t.Fatalf("login as %s returned %d (%s)", email, res.Status, res.Error)
	}

	var out struct {
		Token string `json:"token"`
	}
	res.Decode(t, &out)

	if out.Token == "" {
		t.Fatalf("login as %s returned no token", email)
	}

	return out.Token
}

// Mailbox is a mailer.Sender that keeps what it is asked to send instead of
// delivering it.
type Mailbox struct {
	mu     sync.Mutex
	resets []PasswordReset
}

// PasswordReset is a password-reset email the application sent.
type PasswordReset struct {
	Recipient string
	Token     string
}

// SendPasswordReset records the email.
func (m *Mailbox) SendPasswordReset(_ context.Context, recipient, token string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.resets = append(m.resets, PasswordReset{Recipient: recipient, Token: token})

	return nil
}

// PasswordResets returns the password-reset emails sent so far, oldest first.
func (m *Mailbox) PasswordResets() []PasswordReset {
	m.mu.Lock()
	defer m.mu.Unlock()

	return append([]PasswordReset(nil), m.resets...)
}
