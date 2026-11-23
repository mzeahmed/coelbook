// Package testutil provides what API integration tests need: a throwaway
// PostgreSQL database with the real migrations applied, and an HTTP server
// running the real router, driven through a small JSON client.
//
// Integration tests need a PostgreSQL server they may create databases on,
// given by the TEST_DATABASE_URL environment variable (the same URL form as
// DATABASE_URL; its database is only used to connect). Without it the tests
// are skipped, so a plain `go test ./...` still works anywhere. `make
// test-integration` sets it from the development database.
package testutil

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"io"
	"log/slog"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mzeahmed/coelbook/internal/database"
)

// EnvDatabaseURL names the environment variable holding the URL of the
// PostgreSQL server used by integration tests.
const EnvDatabaseURL = "TEST_DATABASE_URL"

// NewPool creates an empty database for the calling test, applies every
// migration to it and returns a pool connected to it. The database is
// dropped when the test ends, so tests never share or leak state. The test
// is skipped if TEST_DATABASE_URL is not set.
func NewPool(t testing.TB) *pgxpool.Pool {
	t.Helper()

	serverURL := os.Getenv(EnvDatabaseURL)
	if serverURL == "" {
		t.Skipf("%s is not set; skipping integration test", EnvDatabaseURL)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	admin, err := pgx.Connect(ctx, serverURL)
	if err != nil {
		t.Fatalf("connect to the test database server: %v", err)
	}
	defer func() { _ = admin.Close(ctx) }()

	name := "coelbook_test_" + randomSuffix(t)

	// The name is generated here (hex only), never user input.
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+name); err != nil {
		t.Fatalf("create test database: %v", err)
	}

	config, err := pgxpool.ParseConfig(serverURL)
	if err != nil {
		t.Fatalf("parse %s: %v", EnvDatabaseURL, err)
	}

	config.ConnConfig.Database = name

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		dropDatabase(t, serverURL, name)
		t.Fatalf("connect to the test database: %v", err)
	}

	t.Cleanup(func() {
		pool.Close()
		dropDatabase(t, serverURL, name)
	})

	discard := slog.New(slog.NewTextHandler(io.Discard, nil))
	if err := database.Migrate(ctx, pool, discard); err != nil {
		t.Fatalf("migrate the test database: %v", err)
	}

	return pool
}

func dropDatabase(t testing.TB, serverURL, name string) {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	admin, err := pgx.Connect(ctx, serverURL)
	if err != nil {
		t.Errorf("connect to drop test database %s: %v", name, err)

		return
	}
	defer func() { _ = admin.Close(ctx) }()

	if _, err := admin.Exec(ctx, "DROP DATABASE IF EXISTS "+name+" WITH (FORCE)"); err != nil {
		t.Errorf("drop test database %s: %v", name, err)
	}
}

func randomSuffix(t testing.TB) string {
	t.Helper()

	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		t.Fatalf("generate test database name: %v", err)
	}

	return hex.EncodeToString(b)
}
