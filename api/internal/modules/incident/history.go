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

// Restore makes the incident identified by slug match the content it had at
// version, on behalf of userID. History is never rewritten: the restored
// content is saved as a new version at the top, so the restoration itself
// can be undone. Restoring content identical to the current one adds no
// version. It returns ErrNotFound or ErrVersionNotFound if the incident or
// the version doesn't exist, and ErrUnknownCategory if the version's
// category no longer exists.
func (s *Service) Restore(ctx context.Context, userID int64, slug string, version int32) (Detail, error) {

	v, err := s.Version(ctx, slug, version)
	if err != nil {
		if errors.Is(err, ErrVersionNotFound) {
			// Tell a missing incident apart from a missing version.
			if _, getErr := s.Get(ctx, slug); getErr != nil {
				return Detail{}, getErr
			}
		}

		return Detail{}, err
	}

	var snap struct {
		Title      string `json:"title"`
		Summary    string `json:"summary"`
		Problem    string `json:"problem"`
		Diagnosis  string `json:"diagnosis"`
		RootCause  string `json:"root_cause"`
		Solution   string `json:"solution"`
		Prevention string `json:"prevention"`
		Status     string `json:"status"`
		Category   struct {
			Slug string `json:"slug"`
		} `json:"category"`
		Tags     []string       `json:"tags"`
		Snippets []SnippetInput `json:"snippets"`
		Links    []LinkInput    `json:"links"`
	}
	if err := json.Unmarshal(v.Snapshot, &snap); err != nil {
		return Detail{}, err
	}

	return s.Update(ctx, userID, slug, WriteRequest{
		Title:      snap.Title,
		Summary:    snap.Summary,
		Problem:    snap.Problem,
		Diagnosis:  snap.Diagnosis,
		RootCause:  snap.RootCause,
		Solution:   snap.Solution,
		Prevention: snap.Prevention,
		Status:     snap.Status,
		Category:   snap.Category.Slug,
		Tags:       snap.Tags,
		Snippets:   snap.Snippets,
		Links:      snap.Links,
	})
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

// RestoreVersion handles POST /incidents/{slug}/versions/{version}/restore.
// The authenticated caller is recorded as the author of the new version.
func (h *Handler) RestoreVersion(w http.ResponseWriter, r *http.Request) {

	userID, ok := currentUserID(w, r)
	if !ok {
		return
	}

	n, err := strconv.ParseInt(r.PathValue("version"), 10, 32)
	if err != nil || n < 1 {
		response.AppError(w, http.StatusNotFound, ErrVersionNotFound)

		return
	}

	res, err := h.service.Restore(r.Context(), userID, r.PathValue("slug"), int32(n))
	if err != nil {
		if errors.Is(err, ErrUnknownCategory) {
			response.AppError(w, http.StatusBadRequest, err)

			return
		}

		writeHistoryError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "version restored", res)
}

func writeHistoryError(w http.ResponseWriter, err error) {

	switch {
	case errors.Is(err, ErrNotFound), errors.Is(err, ErrVersionNotFound):
		response.AppError(w, http.StatusNotFound, err)
	default:
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")
	}
}
