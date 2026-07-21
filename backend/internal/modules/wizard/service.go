package wizard

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	repo "github.com/mzeahmed/playbook/internal/database/queries"
	"github.com/mzeahmed/playbook/internal/password"
)

// ErrAlreadyInitialized is returned by Setup when the wizard has already
// been completed.
var ErrAlreadyInitialized = errors.New("wizard: application is already initialized")

// uniqueViolation is the Postgres error code raised when a unique or
// primary key constraint is violated.
const uniqueViolation = "23505"

// Service implements the first-time setup workflow: reporting whether the
// instance is initialized, and performing the one-time initialization
// itself.
type Service struct {
	pool *pgxpool.Pool
}

// NewService builds a Service backed by the given connection pool.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// Status reports whether the setup wizard has already been completed.
func (s *Service) Status(ctx context.Context) (bool, error) {

	if _, err := repo.New(s.pool).GetSettings(ctx); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}

		return false, err
	}

	return true, nil
}

// Setup creates the administrator account and stores the instance
// configuration in a single transaction: either both are persisted along
// with the initialization state, or nothing is.
//
// It fails with ErrAlreadyInitialized if the wizard has already run.
func (s *Service) Setup(ctx context.Context, req SetupRequest) error {

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := repo.New(tx)

	if _, err := q.GetSettings(ctx); err == nil {
		return ErrAlreadyInitialized
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	hash, err := password.Hash(req.Admin.Password)
	if err != nil {
		return err
	}

	if _, err := q.CreateUser(ctx, repo.CreateUserParams{
		Email:        req.Admin.Email,
		PasswordHash: hash,
		FirstName:    req.Admin.FirstName,
		LastName:     req.Admin.LastName,
	}); err != nil {
		return err
	}

	if _, err := q.CreateSettings(ctx, repo.CreateSettingsParams{
		InstanceName: req.Instance.Name,
		Timezone:     req.Instance.Timezone,
		Locale:       req.Instance.Locale,
	}); err != nil {
		// The settings table has a fixed primary key, so a unique violation
		// here means a concurrent request won the race to initialize the
		// instance first.
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolation {
			return ErrAlreadyInitialized
		}

		return err
	}

	return tx.Commit(ctx)
}