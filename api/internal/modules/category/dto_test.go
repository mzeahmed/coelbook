package category

import (
	"errors"
	"strings"
	"testing"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

func TestWriteRequestValidate(t *testing.T) {
	tests := []struct {
		name     string
		req      WriteRequest
		wantCode string
	}{
		{"valid", WriteRequest{Name: "Réseau", Description: "DNS, proxy"}, ""},
		{"valid without description", WriteRequest{Name: "Docker"}, ""},
		{"blank name", WriteRequest{Name: "   "}, "category_name_required"},
		{"long name", WriteRequest{Name: strings.Repeat("é", maxNameLength+1)}, "category_name_too_long"},
		{"long description", WriteRequest{Name: "Docker", Description: strings.Repeat("a", maxDescriptionLength+1)}, "category_description_too_long"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()

			if tt.wantCode == "" {
				if err != nil {
					t.Fatalf("Validate() = %v, want nil", err)
				}

				return
			}

			var appErr *apperr.Error
			if !errors.As(err, &appErr) || appErr.Code != tt.wantCode {
				t.Fatalf("Validate() = %v, want code %q", err, tt.wantCode)
			}
		})
	}
}
