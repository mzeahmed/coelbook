package tag

import (
	"errors"
	"strings"
	"testing"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

func code(err error) string {
	var appErr *apperr.Error
	if errors.As(err, &appErr) {
		return appErr.Code
	}

	return ""
}

func TestRenameRequestValidate(t *testing.T) {
	tests := []struct {
		name string
		req  RenameRequest
		want string
	}{
		{"valid", RenameRequest{Name: "Kubernetes"}, ""},
		{"blank", RenameRequest{Name: "  "}, "tag_name_required"},
		{"too long", RenameRequest{Name: strings.Repeat("é", maxNameLength+1)}, "tag_name_too_long"},
	}

	for _, tt := range tests {
		if got := code(tt.req.Validate()); got != tt.want {
			t.Errorf("%s: Validate() code = %q, want %q", tt.name, got, tt.want)
		}
	}
}

func TestMergeRequestValidate(t *testing.T) {
	if got := code(MergeRequest{Into: " "}.Validate()); got != "tag_merge_target_required" {
		t.Errorf("blank target: code = %q", got)
	}

	if err := (MergeRequest{Into: "docker"}).Validate(); err != nil {
		t.Errorf("valid target: %v", err)
	}
}
