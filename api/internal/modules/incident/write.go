package incident

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
	"github.com/mzeahmed/coelbook/internal/slug"
)

// fallbackSlug is used when the title has no character slug.Make can keep
// (e.g. a title written only in a non-Latin script).
const fallbackSlug = "incident"

// reservedSlugs can't be used by an incident because the frontend routes
// them to something else (/incidents/new is the creation form).
var reservedSlugs = map[string]bool{"new": true}

// Create stores a new incident authored by userID and returns it. Its slug
// is derived from the title and suffixed (-2, -3, …) if already taken.
func (s *Service) Create(ctx context.Context, userID int64, req WriteRequest) (Detail, error) {

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Detail{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := repo.New(tx)

	categoryID, err := categoryID(ctx, q, req.Category)
	if err != nil {
		return Detail{}, err
	}

	slug, err := uniqueSlug(ctx, q, req.Title)
	if err != nil {
		return Detail{}, err
	}

	id, err := q.CreateIncident(ctx, repo.CreateIncidentParams{
		Title:      strings.TrimSpace(req.Title),
		Slug:       slug,
		Summary:    optionalText(req.Summary),
		Problem:    optionalText(req.Problem),
		Diagnosis:  optionalText(req.Diagnosis),
		RootCause:  optionalText(req.RootCause),
		Solution:   optionalText(req.Solution),
		Prevention: optionalText(req.Prevention),
		Status:     repo.IncidentStatus(req.Status),
		CategoryID: categoryID,
		CreatedBy:  userID,
	})
	if err != nil {
		return Detail{}, err
	}

	if err := setTags(ctx, q, id, req.Tags); err != nil {
		return Detail{}, err
	}

	if err := setSnippets(ctx, q, id, req.Snippets); err != nil {
		return Detail{}, err
	}

	if err := setLinks(ctx, q, id, req.Links); err != nil {
		return Detail{}, err
	}

	// Last, so the full-text document sees the new tags and snippets.
	if err := q.RefreshIncidentSearchVector(ctx, id); err != nil {
		return Detail{}, err
	}

	// After every other write, so the snapshot holds the final state.
	if _, err := q.RecordIncidentVersion(ctx, repo.RecordIncidentVersionParams{
		IncidentID: id,
		AuthorID:   pgtype.Int8{Int64: userID, Valid: true},
	}); err != nil {
		return Detail{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Detail{}, err
	}

	return s.Get(ctx, slug)
}

// Update replaces the editable fields of the incident identified by slug,
// on behalf of userID (recorded as the author of the new version), and
// returns it. The slug itself never changes. It returns ErrNotFound if no
// incident has that slug.
func (s *Service) Update(ctx context.Context, userID int64, slug string, req WriteRequest) (Detail, error) {

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Detail{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := repo.New(tx)

	categoryID, err := categoryID(ctx, q, req.Category)
	if err != nil {
		return Detail{}, err
	}

	id, err := q.UpdateIncident(ctx, repo.UpdateIncidentParams{
		Title:      strings.TrimSpace(req.Title),
		Summary:    optionalText(req.Summary),
		Problem:    optionalText(req.Problem),
		Diagnosis:  optionalText(req.Diagnosis),
		RootCause:  optionalText(req.RootCause),
		Solution:   optionalText(req.Solution),
		Prevention: optionalText(req.Prevention),
		Status:     repo.IncidentStatus(req.Status),
		CategoryID: categoryID,
		Slug:       slug,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Detail{}, ErrNotFound
		}

		return Detail{}, err
	}

	if err := q.DeleteIncidentTags(ctx, id); err != nil {
		return Detail{}, err
	}

	if err := setTags(ctx, q, id, req.Tags); err != nil {
		return Detail{}, err
	}

	if err := setSnippets(ctx, q, id, req.Snippets); err != nil {
		return Detail{}, err
	}

	if err := setLinks(ctx, q, id, req.Links); err != nil {
		return Detail{}, err
	}

	// Last, so the full-text document sees the new tags and snippets.
	if err := q.RefreshIncidentSearchVector(ctx, id); err != nil {
		return Detail{}, err
	}

	// After every other write, so the snapshot holds the final state.
	if _, err := q.RecordIncidentVersion(ctx, repo.RecordIncidentVersionParams{
		IncidentID: id,
		AuthorID:   pgtype.Int8{Int64: userID, Valid: true},
	}); err != nil {
		return Detail{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Detail{}, err
	}

	return s.Get(ctx, slug)
}

// categoryID resolves a category slug to its id, returning
// ErrUnknownCategory if it doesn't exist.
func categoryID(ctx context.Context, q *repo.Queries, slug string) (int64, error) {

	id, err := q.GetCategoryIDBySlug(ctx, strings.TrimSpace(slug))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrUnknownCategory
		}

		return 0, err
	}

	return id, nil
}

// uniqueSlug derives a slug from title that no incident uses yet, by
// appending -2, -3, … to the base slug until a free one is found.
func uniqueSlug(ctx context.Context, q *repo.Queries, title string) (string, error) {

	base := slug.Make(title)
	if base == "" {
		base = fallbackSlug
	}

	candidate := base
	for n := 2; ; n++ {
		taken, err := q.IncidentSlugExists(ctx, candidate)
		if err != nil {
			return "", err
		}

		if !taken && !reservedSlugs[candidate] {
			return candidate, nil
		}

		candidate = base + "-" + strconv.Itoa(n)
	}
}

// setTags attaches tags to the incident, creating any tag that doesn't
// exist yet. Names are trimmed; blank names, and names that slug.Make maps to
// the same slug as an earlier one, are skipped.
func setTags(ctx context.Context, q *repo.Queries, incidentID int64, names []string) error {

	seen := make(map[string]bool, len(names))

	for _, name := range names {
		name = strings.TrimSpace(name)
		tagSlug := slug.Make(name)

		if tagSlug == "" || seen[tagSlug] {
			continue
		}
		seen[tagSlug] = true

		tagID, err := q.UpsertTag(ctx, repo.UpsertTagParams{Name: name, Slug: tagSlug})
		if err != nil {
			return fmt.Errorf("upsert tag %q: %w", name, err)
		}

		if err := q.AddIncidentTag(ctx, repo.AddIncidentTagParams{IncidentID: incidentID, TagID: tagID}); err != nil {
			return err
		}
	}

	return nil
}

// setSnippets replaces the incident's snippets with snippets, stored in
// list order.
func setSnippets(ctx context.Context, q *repo.Queries, incidentID int64, snippets []SnippetInput) error {

	if err := q.DeleteIncidentSnippets(ctx, incidentID); err != nil {
		return err
	}

	for i, sn := range snippets {
		language := strings.TrimSpace(sn.Language)
		if language == "" {
			language = defaultSnippetLanguage
		}

		if err := q.CreateSnippet(ctx, repo.CreateSnippetParams{
			IncidentID: incidentID,
			Title:      strings.TrimSpace(sn.Title),
			Language:   language,
			// Content is kept verbatim: leading indentation and trailing
			// newlines can matter in code.
			Content:  sn.Content,
			Position: int32(i),
		}); err != nil {
			return err
		}
	}

	return nil
}

// setLinks replaces the incident's links with links, stored in list order.
func setLinks(ctx context.Context, q *repo.Queries, incidentID int64, links []LinkInput) error {

	if err := q.DeleteIncidentLinks(ctx, incidentID); err != nil {
		return err
	}

	for _, l := range links {
		u := strings.TrimSpace(l.URL)

		title := strings.TrimSpace(l.Title)
		if title == "" {
			title = u
		}

		if err := q.CreateLink(ctx, repo.CreateLinkParams{IncidentID: incidentID, Title: title, Url: u}); err != nil {
			return err
		}
	}

	return nil
}

// optionalText maps a free-text field to a nullable column: blank input
// is stored as NULL rather than an empty string.
func optionalText(s string) pgtype.Text {

	s = strings.TrimSpace(s)

	return pgtype.Text{String: s, Valid: s != ""}
}
