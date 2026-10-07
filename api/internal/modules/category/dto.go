package category

import (
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

const (
	maxNameLength        = 100
	maxDescriptionLength = 500
)

// Category is the public representation of a category.
type Category struct {
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	Description   string `json:"description"`
	IncidentCount int64  `json:"incident_count"`
}

// WriteRequest is the expected JSON body of POST /categories and
// PUT /categories/{slug}.
type WriteRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Validate checks that the request contains usable data. The returned
// error is an *apperr.Error whose Field points at the offending input.
func (r WriteRequest) Validate() error {

	name := strings.TrimSpace(r.Name)
	if name == "" {
		return apperr.NewField("category_name_required", "name", "name is required")
	}

	if utf8.RuneCountInString(name) > maxNameLength {
		return apperr.NewField("category_name_too_long", "name", fmt.Sprintf("name must be at most %d characters", maxNameLength))
	}

	if utf8.RuneCountInString(strings.TrimSpace(r.Description)) > maxDescriptionLength {
		return apperr.NewField("category_description_too_long", "description", fmt.Sprintf("description must be at most %d characters", maxDescriptionLength))
	}

	return nil
}
