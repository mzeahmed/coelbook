package category

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
)

// Service contains the business logic of the category module.
type Service struct {
	pool *pgxpool.Pool
}

// NewService creates a new category service.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// List returns every category, sorted by name.
func (s *Service) List(ctx context.Context) ([]Category, error) {

	rows, err := repo.New(s.pool).ListCategories(ctx)
	if err != nil {
		return nil, err
	}

	categories := make([]Category, len(rows))
	for i, row := range rows {
		categories[i] = Category{Name: row.Name, Slug: row.Slug}
	}

	return categories, nil
}
