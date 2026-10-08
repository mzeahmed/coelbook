package incident

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/mzeahmed/coelbook/internal/apperr"
	repo "github.com/mzeahmed/coelbook/internal/database/queries"
	"github.com/mzeahmed/coelbook/internal/response"
)

// An incident's history: each create or update that changed something
// recorded a full snapshot (see RecordIncidentVersion), so any two versions
// can be compared by the client.

// ErrVersionNotFound is returned when an incident has no such version.
var ErrVersionNotFound = apperr.New("version_not_found", "version not found")

// VersionSummary describes one version in an incident's history.
type VersionSummary struct {
	Version   int32  `json:"version"`
	CreatedAt string `json:"created_at"`
	// Author is nil when the user who made the change was deleted.
	Author *Author `json:"author"`
	// ChangedFields lists the snapshot keys that differ from the previous
	// version (title, solution, tags…); empty for version 1.
	ChangedFields []string `json:"changed_fields"`
}

// Version is a full version: its summary and the incident's content at
// that point (title, summary, the five sections, status, category, tags,
// snippets and links).
type Version struct {
	VersionSummary
	Snapshot json.RawMessage `json:"snapshot"`
}

// Versions returns the history of the incident identified by slug, newest
// first. It returns ErrNotFound if no incident has that slug (every
// incident has at least one version).
func (s *Service) Versions(ctx context.Context, slug string) ([]VersionSummary, error) {

	rows, err := repo.New(s.pool).ListIncidentVersions(ctx, slug)
	if err != nil {
		return nil, err
	}

	if len(rows) == 0 {
		return nil, ErrNotFound
	}

	versions := make([]VersionSummary, len(rows))
	for i, row := range rows {
		versions[i] = versionSummary(row.Version, row.CreatedAt, row.AuthorFirstName, row.AuthorLastName, row.ChangedFields)
	}

	return versions, nil
}

// Version returns one version of the incident identified by slug.
func (s *Service) Version(ctx context.Context, slug string, version int32) (Version, error) {

	row, err := repo.New(s.pool).GetIncidentVersion(ctx, repo.GetIncidentVersionParams{Slug: slug, Version: version})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Version{}, ErrVersionNotFound
		}

		return Version{}, err
	}

	return Version{
		VersionSummary: versionSummary(row.Version, row.CreatedAt, row.AuthorFirstName, row.AuthorLastName, row.ChangedFields),
		Snapshot:       row.Snapshot,
	}, nil
}

func versionSummary(version int32, createdAt pgtype.Timestamptz, first, last pgtype.Text, changed []string) VersionSummary {

	var author *Author
	if first.Valid {
		author = &Author{FirstName: first.String, LastName: last.String}
	}

	if changed == nil {
		changed = []string{}
	}

	return VersionSummary{
		Version:       version,
		CreatedAt:     createdAt.Time.Format(time.RFC3339),
		Author:        author,
		ChangedFields: changed,
	}
}

// ListVersions handles GET /incidents/{slug}/versions.
func (h *Handler) ListVersions(w http.ResponseWriter, r *http.Request) {

	res, err := h.service.Versions(r.Context(), r.PathValue("slug"))
	if err != nil {
		writeHistoryError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "", res)
}

// GetVersion handles GET /incidents/{slug}/versions/{version}.
func (h *Handler) GetVersion(w http.ResponseWriter, r *http.Request) {

	n, err := strconv.ParseInt(r.PathValue("version"), 10, 32)
	if err != nil || n < 1 {
		response.AppError(w, http.StatusNotFound, ErrVersionNotFound)

		return
	}

	res, err := h.service.Version(r.Context(), r.PathValue("slug"), int32(n))
	if err != nil {
		writeHistoryError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "", res)
}

func writeHistoryError(w http.ResponseWriter, err error) {

	switch {
	case errors.Is(err, ErrNotFound), errors.Is(err, ErrVersionNotFound):
		response.AppError(w, http.StatusNotFound, err)
	default:
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")
	}
}
