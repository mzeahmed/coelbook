package category

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
	"github.com/mzeahmed/coelbook/internal/slug"
)

// Postgres error codes for constraint violations.
const (
	uniqueViolation     = "23505"
	foreignKeyViolation = "23503"
)

// fallbackSlug is used when the name has no character slug.Make can keep.
const fallbackSlug = "category"

// Service contains the business logic of the category module.
type Service struct {
	pool *pgxpool.Pool
}

// NewService creates a new category service.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// List returns every category with its incident count, sorted by name.
func (s *Service) List(ctx context.Context) ([]Category, error) {

	rows, err := repo.New(s.pool).ListCategories(ctx)
	if err != nil {
		return nil, err
	}

	categories := make([]Category, len(rows))
	for i, row := range rows {
		categories[i] = Category{
			Name:          row.Name,
			Slug:          row.Slug,
			Description:   row.Description.String,
			IncidentCount: row.IncidentCount,
		}
	}

	return categories, nil
}

// Create stores a new category and returns it. Its slug is derived from
// the name and suffixed (-2, -3, …) if already taken.
func (s *Service) Create(ctx context.Context, req WriteRequest) (Category, error) {

	q := repo.New(s.pool)
	name := strings.TrimSpace(req.Name)

	if err := checkNameFree(ctx, q, name, ""); err != nil {
		return Category{}, err
	}

	categorySlug, err := uniqueSlug(ctx, q, name)
	if err != nil {
		return Category{}, err
	}

	err = q.CreateCategory(ctx, repo.CreateCategoryParams{
		Name:        name,
		Slug:        categorySlug,
		Description: optionalText(req.Description),
	})
	if err != nil {
		return Category{}, mapConstraintError(err)
	}

	return s.get(ctx, categorySlug)
}

// Update renames the category identified by categorySlug and replaces its
// description. The slug itself never changes.
func (s *Service) Update(ctx context.Context, categorySlug string, req WriteRequest) (Category, error) {

	q := repo.New(s.pool)
	name := strings.TrimSpace(req.Name)

	if err := checkNameFree(ctx, q, name, categorySlug); err != nil {
		return Category{}, err
	}

	n, err := q.UpdateCategory(ctx, repo.UpdateCategoryParams{
		Name:        name,
		Description: optionalText(req.Description),
		Slug:        categorySlug,
	})
	if err != nil {
		return Category{}, mapConstraintError(err)
	}

	if n == 0 {
		return Category{}, ErrNotFound
	}

	return s.get(ctx, categorySlug)
}

// Delete removes the category identified by categorySlug. It fails with
// ErrInUse while incidents still belong to it; the database's foreign key
// enforces this, so a concurrent incident creation can't slip through.
func (s *Service) Delete(ctx context.Context, categorySlug string) error {

	n, err := repo.New(s.pool).DeleteCategory(ctx, categorySlug)
	if err != nil {
		return mapConstraintError(err)
	}

	if n == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *Service) get(ctx context.Context, categorySlug string) (Category, error) {

	row, err := repo.New(s.pool).GetCategoryBySlug(ctx, categorySlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Category{}, ErrNotFound
		}

		return Category{}, err
	}

	return Category{
		Name:          row.Name,
		Slug:          row.Slug,
		Description:   row.Description.String,
		IncidentCount: row.IncidentCount,
	}, nil
}

// checkNameFree returns ErrNameTaken if a category other than excludeSlug
// already has name (case-insensitively).
func checkNameFree(ctx context.Context, q *repo.Queries, name, excludeSlug string) error {

	taken, err := q.CategoryNameTaken(ctx, repo.CategoryNameTakenParams{Name: name, ExcludeSlug: excludeSlug})
	if err != nil {
		return err
	}

	if taken {
		return ErrNameTaken
	}

	return nil
}

// uniqueSlug derives a slug from name that no category uses yet.
func uniqueSlug(ctx context.Context, q *repo.Queries, name string) (string, error) {

	base := slug.Make(name)
	if base == "" {
		base = fallbackSlug
	}

	candidate := base
	for n := 2; ; n++ {
		taken, err := q.CategorySlugExists(ctx, candidate)
		if err != nil {
			return "", err
		}

		if !taken {
			return candidate, nil
		}

		candidate = base + "-" + strconv.Itoa(n)
	}
}

// mapConstraintError turns the constraint violations a write can hit into
// domain errors: a unique violation is a name taken by a concurrent
// request (the case-insensitive check passed just before), a foreign key
// violation a category still used by incidents.
func mapConstraintError(err error) error {

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case uniqueViolation:
			return ErrNameTaken
		case foreignKeyViolation:
			return ErrInUse
		}
	}

	return err
}

// optionalText maps a free-text field to a nullable column: blank input
// is stored as NULL rather than an empty string.
func optionalText(s string) pgtype.Text {

	s = strings.TrimSpace(s)

	return pgtype.Text{String: s, Valid: s != ""}
}
