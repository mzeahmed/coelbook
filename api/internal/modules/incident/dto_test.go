package incident

import (
	"errors"
	"strings"
	"testing"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

func validRequest() WriteRequest {
	return WriteRequest{
		Title:    "Postgres connection refused",
		Status:   "draft",
		Category: "database",
		Snippets: []SnippetInput{{Title: "Restart", Language: "bash", Content: "systemctl restart postgresql"}},
		Links:    []LinkInput{{Title: "Docs", URL: "https://www.postgresql.org/docs/"}},
	}
}

func TestWriteRequestValidate(t *testing.T) {
	tests := []struct {
		name      string
		mutate    func(r *WriteRequest)
		wantCode  string
		wantField string
	}{
		{"valid", func(r *WriteRequest) {}, "", ""},
		{"blank title", func(r *WriteRequest) { r.Title = "  " }, "title_required", "title"},
		{"long title", func(r *WriteRequest) { r.Title = strings.Repeat("é", maxTitleLength+1) }, "title_too_long", "title"},
		{"bad status", func(r *WriteRequest) { r.Status = "deleted" }, "invalid_status", "status"},
		{"no category", func(r *WriteRequest) { r.Category = "" }, "category_required", "category"},
		{"too many tags", func(r *WriteRequest) { r.Tags = make([]string, maxTags+1) }, "too_many_tags", "tags"},
		{"too many snippets", func(r *WriteRequest) { r.Snippets = make([]SnippetInput, maxSnippets+1) }, "too_many_snippets", "snippets"},
		{"snippet without title", func(r *WriteRequest) {
			r.Snippets = append(r.Snippets, SnippetInput{Content: "ls"})
		}, "snippet_title_required", "snippets[1].title"},
		{"snippet without content", func(r *WriteRequest) { r.Snippets[0].Content = "\n " }, "snippet_content_required", "snippets[0].content"},
		{"snippet without language is fine", func(r *WriteRequest) { r.Snippets[0].Language = "" }, "", ""},
		{"too many links", func(r *WriteRequest) { r.Links = make([]LinkInput, maxLinks+1) }, "too_many_links", "links"},
		{"link without url", func(r *WriteRequest) { r.Links[0].URL = "" }, "link_url_required", "links[0].url"},
		{"link with javascript url", func(r *WriteRequest) { r.Links[0].URL = "javascript:alert(1)" }, "invalid_link_url", "links[0].url"},
		{"link with relative url", func(r *WriteRequest) { r.Links[0].URL = "/docs" }, "invalid_link_url", "links[0].url"},
		{"link without title is fine", func(r *WriteRequest) { r.Links[0].Title = "" }, "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := validRequest()
			tt.mutate(&r)

			err := r.Validate()

			if tt.wantCode == "" {
				if err != nil {
					t.Fatalf("Validate() = %v, want nil", err)
				}

				return
			}

			var appErr *apperr.Error
			if !errors.As(err, &appErr) {
				t.Fatalf("Validate() = %v, want *apperr.Error", err)
			}

			if appErr.Code != tt.wantCode || appErr.Field != tt.wantField {
				t.Fatalf("Validate() = {code %q, field %q}, want {code %q, field %q}", appErr.Code, appErr.Field, tt.wantCode, tt.wantField)
			}
		})
	}
}
