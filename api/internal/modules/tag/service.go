package tag

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
)

// Service contains the business logic of the tag module.
type Service struct {
	pool *pgxpool.Pool
}

// NewService creates a new tag service.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// List returns every tag used by at least one incident, sorted by name.
func (s *Service) List(ctx context.Context) ([]Tag, error) {

	rows, err := repo.New(s.pool).ListUsedTags(ctx)
	if err != nil {
		return nil, err
	}

	tags := make([]Tag, len(rows))
	for i, row := range rows {
		tags[i] = Tag{Name: row.Name, Slug: row.Slug}
	}

	return tags, nil
}
