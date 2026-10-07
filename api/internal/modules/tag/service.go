package tag

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
	"github.com/mzeahmed/coelbook/internal/slug"
)

// Service contains the business logic of the tag module.
//
// A tag's identity is its slug, derived from its name: the incident form
// creates tags by name and finds existing ones by slug. Renaming a tag
// therefore changes its slug too, and a name whose slug is already taken
// means merging into that tag.
//
// Tag names are part of every incident's full-text document, so each
// write refreshes the search vector of the incidents it touches.
type Service struct {
	pool *pgxpool.Pool
}

// NewService creates a new tag service.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// List returns tags sorted by name with their incident count. Unused tags
// are only included when includeUnused is set (the filters only need the
// used ones; the management page needs them all).
func (s *Service) List(ctx context.Context, includeUnused bool) ([]Tag, error) {

	rows, err := repo.New(s.pool).ListTagsWithCounts(ctx)
	if err != nil {
		return nil, err
	}

	tags := make([]Tag, 0, len(rows))
	for _, row := range rows {
		if row.IncidentCount == 0 && !includeUnused {
			continue
		}

		tags = append(tags, Tag{Name: row.Name, Slug: row.Slug, IncidentCount: row.IncidentCount})
	}

	return tags, nil
}

// Rename gives the tag identified by tagSlug a new name (and the slug
// derived from it). It returns ErrExists if that slug belongs to another
// tag.
func (s *Service) Rename(ctx context.Context, tagSlug string, req RenameRequest) (Tag, error) {

	name := strings.TrimSpace(req.Name)

	newSlug := slug.Make(name)
	if newSlug == "" {
		return Tag{}, ErrNameInvalid
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Tag{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := repo.New(tx)

	tag, err := getTag(ctx, q, tagSlug)
	if err != nil {
		return Tag{}, err
	}

	if newSlug != tag.Slug {
		taken, err := q.TagSlugExists(ctx, newSlug)
		if err != nil {
			return Tag{}, err
		}

		if taken {
			return Tag{}, ErrExists
		}
	}

	if err := q.RenameTag(ctx, repo.RenameTagParams{ID: tag.ID, Name: name, Slug: newSlug}); err != nil {
		return Tag{}, err
	}

	ids, err := q.ListIncidentIDsForTag(ctx, tag.ID)
	if err != nil {
		return Tag{}, err
	}

	if err := q.RefreshIncidentSearchVectors(ctx, ids); err != nil {
		return Tag{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Tag{}, err
	}

	return Tag{Name: name, Slug: newSlug, IncidentCount: int64(len(ids))}, nil
}

// Merge moves every incident tagged tagSlug onto the tag intoSlug, then
// deletes tagSlug. It returns the resulting tag.
func (s *Service) Merge(ctx context.Context, tagSlug string, req MergeRequest) (Tag, error) {

	intoSlug := strings.TrimSpace(req.Into)
	if intoSlug == tagSlug {
		return Tag{}, ErrMergeIntoItself
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Tag{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := repo.New(tx)

	from, err := getTag(ctx, q, tagSlug)
	if err != nil {
		return Tag{}, err
	}

	into, err := getTag(ctx, q, intoSlug)
	if err != nil {
		return Tag{}, err
	}

	// Incidents of the merged tag are the ones whose document changes; the
	// target's own incidents keep their tag names.
	ids, err := q.ListIncidentIDsForTag(ctx, from.ID)
	if err != nil {
		return Tag{}, err
	}

	if err := q.CopyIncidentTags(ctx, repo.CopyIncidentTagsParams{FromTagID: from.ID, ToTagID: into.ID}); err != nil {
		return Tag{}, err
	}

	if err := q.DeleteTag(ctx, from.ID); err != nil {
		return Tag{}, err
	}

	if err := q.RefreshIncidentSearchVectors(ctx, ids); err != nil {
		return Tag{}, err
	}

	merged, err := q.ListIncidentIDsForTag(ctx, into.ID)
	if err != nil {
		return Tag{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Tag{}, err
	}

	return Tag{Name: into.Name, Slug: into.Slug, IncidentCount: int64(len(merged))}, nil
}

// Delete removes the tag identified by tagSlug from every incident and
// deletes it.
func (s *Service) Delete(ctx context.Context, tagSlug string) error {

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := repo.New(tx)

	tag, err := getTag(ctx, q, tagSlug)
	if err != nil {
		return err
	}

	// Read before deleting: the incident_tags rows go with the tag.
	ids, err := q.ListIncidentIDsForTag(ctx, tag.ID)
	if err != nil {
		return err
	}

	if err := q.DeleteTag(ctx, tag.ID); err != nil {
		return err
	}

	if err := q.RefreshIncidentSearchVectors(ctx, ids); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// PurgeUnused deletes every tag no incident uses and returns how many
// were deleted. No incident document changes.
func (s *Service) PurgeUnused(ctx context.Context) (int64, error) {
	return repo.New(s.pool).DeleteUnusedTags(ctx)
}

func getTag(ctx context.Context, q *repo.Queries, tagSlug string) (repo.Tag, error) {

	tag, err := q.GetTagBySlug(ctx, tagSlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repo.Tag{}, ErrNotFound
		}

		return repo.Tag{}, err
	}

	return tag, nil
}
