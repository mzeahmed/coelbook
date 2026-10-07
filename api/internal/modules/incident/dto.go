package incident

import (
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

// Category is the public representation of the category an incident
// belongs to.
type Category struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// Author is the public representation of an incident's author.
type Author struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// Summary is the public representation of an incident in a listing.
type Summary struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	Slug      string   `json:"slug"`
	Summary   string   `json:"summary"`
	Status    string   `json:"status"`
	Category  Category `json:"category"`
	Author    Author   `json:"author"`
	Tags      []string `json:"tags"`
	CreatedAt string   `json:"created_at"`
	UpdatedAt string   `json:"updated_at"`
}

// ListFilter holds the optional filters accepted by GET /incidents.
type ListFilter struct {
	Category string
	Status   string
	Tag      string
	Query    string
	Page     int
	PerPage  int
}

// ListResponse is the response body of GET /incidents.
type ListResponse struct {
	Incidents []Summary `json:"incidents"`
	Total     int64     `json:"total"`
	Page      int       `json:"page"`
	PerPage   int       `json:"per_page"`
}

// Snippet is the public representation of a code or command snippet
// attached to an incident.
type Snippet struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Language string `json:"language"`
	Content  string `json:"content"`
}

// Link is the public representation of an external resource referenced
// by an incident.
type Link struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	URL   string `json:"url"`
}

// Detail is the response body of GET /incidents/{slug}: the full incident
// with its structured sections, snippets and links.
type Detail struct {
	Summary
	Problem    string    `json:"problem"`
	Diagnosis  string    `json:"diagnosis"`
	RootCause  string    `json:"root_cause"`
	Solution   string    `json:"solution"`
	Prevention string    `json:"prevention"`
	Snippets   []Snippet `json:"snippets"`
	Links      []Link    `json:"links"`
}

const (
	maxTitleLength = 200
	maxTags        = 20
)

// WriteRequest is the expected JSON body of POST /incidents and
// PUT /incidents/{slug}. Category is a category slug; Tags are tag names,
// created on the fly if they don't exist yet.
type WriteRequest struct {
	Title      string   `json:"title"`
	Summary    string   `json:"summary"`
	Problem    string   `json:"problem"`
	Diagnosis  string   `json:"diagnosis"`
	RootCause  string   `json:"root_cause"`
	Solution   string   `json:"solution"`
	Prevention string   `json:"prevention"`
	Status     string   `json:"status"`
	Category   string   `json:"category"`
	Tags       []string `json:"tags"`
}

// Validate checks that the request contains usable data.
func (r WriteRequest) Validate() error {

	title := strings.TrimSpace(r.Title)
	if title == "" {
		return apperr.New("title_required", "title is required")
	}

	if utf8.RuneCountInString(title) > maxTitleLength {
		return apperr.New("title_too_long", fmt.Sprintf("title must be at most %d characters", maxTitleLength))
	}

	switch r.Status {
	case "draft", "published", "archived":
	default:
		return apperr.New("invalid_status", "status must be one of draft, published or archived")
	}

	if strings.TrimSpace(r.Category) == "" {
		return apperr.New("category_required", "category is required")
	}

	if len(r.Tags) > maxTags {
		return apperr.New("too_many_tags", fmt.Sprintf("at most %d tags are allowed", maxTags))
	}

	return nil
}
