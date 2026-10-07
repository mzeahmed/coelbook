package settings

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mzeahmed/coelbook/internal/apperr"
	repo "github.com/mzeahmed/coelbook/internal/database/queries"
)

// ErrNotInitialized is returned when the setup wizard hasn't been completed,
// so there are no settings to read or change yet.
var ErrNotInitialized = apperr.New("not_initialized", "instance is not initialized")

// Service contains the business logic of the settings module.
type Service struct {
	pool *pgxpool.Pool
}

// NewService creates a new settings service.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// Get returns the instance settings.
func (s *Service) Get(ctx context.Context) (Settings, error) {

	w, err := repo.New(s.pool).GetWizard(ctx)
	if err != nil {
		return Settings{}, notInitialized(err)
	}

	return Settings{InstanceName: w.InstanceName, Timezone: w.Timezone, Locale: w.Locale}, nil
}

// Update replaces the instance settings.
func (s *Service) Update(ctx context.Context, req Settings) (Settings, error) {

	w, err := repo.New(s.pool).UpdateWizard(ctx, repo.UpdateWizardParams{
		InstanceName: strings.TrimSpace(req.InstanceName),
		Timezone:     strings.TrimSpace(req.Timezone),
		Locale:       req.Locale,
	})
	if err != nil {
		return Settings{}, notInitialized(err)
	}

	return Settings{InstanceName: w.InstanceName, Timezone: w.Timezone, Locale: w.Locale}, nil
}

// notInitialized maps "no wizard row" to ErrNotInitialized.
func notInitialized(err error) error {

	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotInitialized
	}

	return err
}
