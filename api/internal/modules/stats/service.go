package stats

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
)

const (
	maxTopTags    = 10
	maxRecent     = 5
	activityWeeks = 12
)

// Service contains the business logic of the stats module.
type Service struct {
	pool *pgxpool.Pool
}

// NewService creates a new stats service.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// Get computes the overview figures. The queries run in one read-only
// repeatable-read transaction so the figures are consistent with each
// other (e.g. the total matches the per-category counts).
func (s *Service) Get(ctx context.Context) (Stats, error) {

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return Stats{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := repo.New(tx)

	statusRows, err := q.CountIncidentsByStatus(ctx)
	if err != nil {
		return Stats{}, err
	}

	categoryRows, err := q.ListCategories(ctx)
	if err != nil {
		return Stats{}, err
	}

	tagRows, err := q.TopTags(ctx, maxTopTags)
	if err != nil {
		return Stats{}, err
	}

	recentRows, err := q.RecentlyUpdatedIncidents(ctx, maxRecent)
	if err != nil {
		return Stats{}, err
	}

	weekRows, err := q.WeeklyIncidentCreations(ctx, activityWeeks)
	if err != nil {
		return Stats{}, err
	}

	res := Stats{
		ByStatus:   map[string]int64{"draft": 0, "published": 0, "archived": 0},
		Categories: make([]CategoryCount, len(categoryRows)),
		TopTags:    make([]TagCount, len(tagRows)),
		Recent:     make([]RecentIncident, len(recentRows)),
		Activity:   make([]WeekCount, len(weekRows)),
	}

	for _, row := range statusRows {
		res.ByStatus[string(row.Status)] = row.Total
		res.Total += row.Total
	}

	for i, row := range categoryRows {
		res.Categories[i] = CategoryCount{Name: row.Name, Slug: row.Slug, IncidentCount: row.IncidentCount}
	}

	for i, row := range tagRows {
		res.TopTags[i] = TagCount{Name: row.Name, Slug: row.Slug, IncidentCount: row.IncidentCount}
	}

	for i, row := range recentRows {
		res.Recent[i] = RecentIncident{
			Title:     row.Title,
			Slug:      row.Slug,
			Status:    string(row.Status),
			Category:  Category{Name: row.CategoryName, Slug: row.CategorySlug},
			UpdatedAt: row.UpdatedAt.Time.Format(time.RFC3339),
		}
	}

	for i, row := range weekRows {
		res.Activity[i] = WeekCount{WeekStart: row.WeekStart.Time.Format(time.DateOnly), Total: row.Total}
	}

	return res, nil
}
