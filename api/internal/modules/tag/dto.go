package tag

import (
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

const maxNameLength = 50

// Tag is the public representation of a tag.
type Tag struct {
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	IncidentCount int64  `json:"incident_count"`
}

// RenameRequest is the expected JSON body of PUT /tags/{slug}.
type RenameRequest struct {
	Name string `json:"name"`
}

// Validate checks that the new name is usable.
func (r RenameRequest) Validate() error {

	name := strings.TrimSpace(r.Name)
	if name == "" {
		return apperr.NewField("tag_name_required", "name", "name is required")
	}

	if utf8.RuneCountInString(name) > maxNameLength {
		return apperr.NewField("tag_name_too_long", "name", fmt.Sprintf("name must be at most %d characters", maxNameLength))
	}

	return nil
}

// MergeRequest is the expected JSON body of POST /tags/{slug}/merge: the
// tag in the URL is merged into the tag Into (a slug), then deleted.
type MergeRequest struct {
	Into string `json:"into"`
}

// Validate checks that a target is given.
func (r MergeRequest) Validate() error {

	if strings.TrimSpace(r.Into) == "" {
		return apperr.NewField("tag_merge_target_required", "into", "target tag is required")
	}

	return nil
}

// PurgeResponse is the response body of DELETE /tags?unused=true.
type PurgeResponse struct {
	Deleted int64 `json:"deleted"`
}
