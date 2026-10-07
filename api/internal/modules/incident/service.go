package incident

import (
	"context"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
)

const defaultPerPage = 9

// Service contains the business logic of the incident module.
type Service struct {
	pool *pgxpool.Pool
}

// NewService creates a new incident service.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// List returns a page of incidents matching filter, most recent first.
func (s *Service) List(ctx context.Context, filter ListFilter) (ListResponse, error) {

	page := filter.Page
	if page < 1 {
		page = 1
	}

	perPage := filter.PerPage
	if perPage < 1 {
		perPage = defaultPerPage
	}

	q := repo.New(s.pool)

	rows, err := q.ListIncidents(ctx, repo.ListIncidentsParams{
		Category:   filter.Category,
		Status:     filter.Status,
		Tag:        filter.Tag,
		Query:      filter.Query,
		PageLimit:  int32(perPage),
		PageOffset: int32((page - 1) * perPage),
	})
	if err != nil {
		return ListResponse{}, err
	}

	total, err := q.CountIncidents(ctx, repo.CountIncidentsParams{
		Category: filter.Category,
		Status:   filter.Status,
		Tag:      filter.Tag,
		Query:    filter.Query,
	})
	if err != nil {
		return ListResponse{}, err
	}

	incidents := make([]Summary, len(rows))
	for i, row := range rows {
		incidents[i] = toSummary(row)
	}

	return ListResponse{
		Incidents: incidents,
		Total:     total,
		Page:      page,
		PerPage:   perPage,
	}, nil
}

// toSummary maps a generated query row to the module's public DTO.
func toSummary(row repo.ListIncidentsRow) Summary {

	return Summary{
		ID:      strconv.FormatInt(row.ID, 10),
		Title:   row.Title,
		Slug:    row.Slug,
		Summary: row.Summary.String,
		Status:  string(row.Status),
		Category: Category{
			Name: row.CategoryName,
			Slug: row.CategorySlug,
		},
		Author: Author{
			FirstName: row.AuthorFirstName,
			LastName:  row.AuthorLastName,
		},
		Tags:      toTags(row.Tags),
		CreatedAt: row.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt: row.UpdatedAt.Time.Format(time.RFC3339),
	}
}

// toTags normalizes the driver's decoding of the tags array (a computed
// column, so sqlc can't infer a concrete []string type for it) into a
// plain []string.
func toTags(v any) []string {

	switch t := v.(type) {
	case []string:
		return t
	case []any:
		tags := make([]string, 0, len(t))
		for _, elem := range t {
			if s, ok := elem.(string); ok {
				tags = append(tags, s)
			}
		}

		return tags
	default:
		return nil
	}
}
