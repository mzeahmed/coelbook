package database

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

// migrations holds the goose SQL migrations, compiled into the binary so a
// deployed instance can migrate itself without the goose CLI or the source
// tree.
//
//go:embed migrations/*.sql
var migrations embed.FS

// Migrate applies every pending migration. It is safe to run on each start:
// applied migrations are recorded in goose's version table (the same one the
// goose CLI behind `make migrate-up` uses), so only new ones run.
func Migrate(ctx context.Context, pool *pgxpool.Pool, log *slog.Logger) error {

	db := stdlib.OpenDBFromPool(pool)
	defer func() { _ = db.Close() }()

	dir, err := fs.Sub(migrations, "migrations")
	if err != nil {
		return fmt.Errorf("open embedded migrations: %w", err)
	}

	provider, err := goose.NewProvider(goose.DialectPostgres, db, dir)
	if err != nil {
		return fmt.Errorf("prepare migrations: %w", err)
	}

	results, err := provider.Up(ctx)
	if err != nil {
		return fmt.Errorf("apply migrations: %w", err)
	}

	for _, r := range results {
		log.Info("migration applied", "version", r.Source.Version, "file", r.Source.Path, "duration", r.Duration)
	}

	version, err := provider.GetDBVersion(ctx)
	if err != nil {
		return fmt.Errorf("read schema version: %w", err)
	}

	log.Info("database schema up to date", "version", version, "applied", len(results))

	return nil
}
