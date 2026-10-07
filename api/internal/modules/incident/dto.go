package incident

import (
	"fmt"
	"net/url"
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
	// Highlight is only set in a listing filtered by a search query.
	Highlight *Highlight `json:"highlight,omitempty"`
}

// Highlight holds the title and summary of a search result with each
// matched term wrapped in HighlightStart / HighlightEnd.
type Highlight struct {
	Title   string `json:"title"`
	Summary string `json:"summary"`
}

// Markers around matched terms in Highlight. They are Unicode private-use
// characters, so they never occur in real content and need no escaping.
const (
	HighlightStart = "\uE000"
	HighlightEnd   = "\uE001"
)

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
	maxSnippets    = 20
	maxLinks       = 20

	// defaultSnippetLanguage is stored when a snippet is saved without a
	// language, since the column is NOT NULL.
	defaultSnippetLanguage = "text"
)

// SnippetInput is a snippet as submitted in a WriteRequest. Its position
// in the list is its display order.
type SnippetInput struct {
	Title    string `json:"title"`
	Language string `json:"language"`
	Content  string `json:"content"`
}

// LinkInput is an external link as submitted in a WriteRequest. A blank
// title is replaced by the URL.
type LinkInput struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

// WriteRequest is the expected JSON body of POST /incidents and
// PUT /incidents/{slug}. Category is a category slug; Tags are tag names,
// created on the fly if they don't exist yet. Tags, Snippets and Links
// each replace the incident's whole list.
type WriteRequest struct {
	Title      string         `json:"title"`
	Summary    string         `json:"summary"`
	Problem    string         `json:"problem"`
	Diagnosis  string         `json:"diagnosis"`
	RootCause  string         `json:"root_cause"`
	Solution   string         `json:"solution"`
	Prevention string         `json:"prevention"`
	Status     string         `json:"status"`
	Category   string         `json:"category"`
	Tags       []string       `json:"tags"`
	Snippets   []SnippetInput `json:"snippets"`
	Links      []LinkInput    `json:"links"`
}

// Validate checks that the request contains usable data. The returned
// error is an *apperr.Error whose Field points at the offending input.
func (r WriteRequest) Validate() error {

	title := strings.TrimSpace(r.Title)
	if title == "" {
		return apperr.NewField("title_required", "title", "title is required")
	}

	if utf8.RuneCountInString(title) > maxTitleLength {
		return apperr.NewField("title_too_long", "title", fmt.Sprintf("title must be at most %d characters", maxTitleLength))
	}

	switch r.Status {
	case "draft", "published", "archived":
	default:
		return apperr.NewField("invalid_status", "status", "status must be one of draft, published or archived")
	}

	if strings.TrimSpace(r.Category) == "" {
		return apperr.NewField("category_required", "category", "category is required")
	}

	if len(r.Tags) > maxTags {
		return apperr.NewField("too_many_tags", "tags", fmt.Sprintf("at most %d tags are allowed", maxTags))
	}

	if len(r.Snippets) > maxSnippets {
		return apperr.NewField("too_many_snippets", "snippets", fmt.Sprintf("at most %d snippets are allowed", maxSnippets))
	}

	for i, sn := range r.Snippets {
		if strings.TrimSpace(sn.Title) == "" {
			return apperr.NewField("snippet_title_required", fmt.Sprintf("snippets[%d].title", i), "snippet title is required")
		}

		if strings.TrimSpace(sn.Content) == "" {
			return apperr.NewField("snippet_content_required", fmt.Sprintf("snippets[%d].content", i), "snippet content is required")
		}
	}

	if len(r.Links) > maxLinks {
		return apperr.NewField("too_many_links", "links", fmt.Sprintf("at most %d links are allowed", maxLinks))
	}

	for i, l := range r.Links {
		field := fmt.Sprintf("links[%d].url", i)

		if strings.TrimSpace(l.URL) == "" {
			return apperr.NewField("link_url_required", field, "link url is required")
		}

		if !isHTTPURL(strings.TrimSpace(l.URL)) {
			return apperr.NewField("invalid_link_url", field, "link url must be an absolute http or https url")
		}
	}

	return nil
}

// isHTTPURL reports whether s is an absolute http(s) URL with a host.
// Other schemes (javascript:, data:, file:…) are rejected since links are
// rendered as clickable anchors.
func isHTTPURL(s string) bool {

	u, err := url.Parse(s)
	if err != nil {
		return false
	}

	return (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}
