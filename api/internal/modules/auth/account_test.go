package auth

import (
	"errors"
	"testing"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

func appCode(err error) (code, field string) {
	var appErr *apperr.Error
	if errors.As(err, &appErr) {
		return appErr.Code, appErr.Field
	}

	return "", ""
}

func TestProfileRequestValidate(t *testing.T) {
	tests := []struct {
		name      string
		req       ProfileRequest
		wantCode  string
		wantField string
	}{
		{"valid", ProfileRequest{"Ada", "Lovelace", "ada@example.com"}, "", ""},
		{"no first name", ProfileRequest{" ", "Lovelace", "ada@example.com"}, "first_name_required", "first_name"},
		{"no last name", ProfileRequest{"Ada", "", "ada@example.com"}, "last_name_required", "last_name"},
		{"no email", ProfileRequest{"Ada", "Lovelace", ""}, "email_required", "email"},
		{"invalid email", ProfileRequest{"Ada", "Lovelace", "ada@"}, "invalid_email", "email"},
		{"display-name form", ProfileRequest{"Ada", "Lovelace", "Ada <ada@example.com>"}, "invalid_email", "email"},
	}

	for _, tt := range tests {
		code, field := appCode(tt.req.Validate())
		if code != tt.wantCode || field != tt.wantField {
			t.Errorf("%s: got (%q, %q), want (%q, %q)", tt.name, code, field, tt.wantCode, tt.wantField)
		}
	}
}

func TestPasswordChangeRequestValidate(t *testing.T) {
	if code, field := appCode(PasswordChangeRequest{"", "newpassword"}.Validate()); code != "current_password_required" || field != "current_password" {
		t.Errorf("missing current: got (%q, %q)", code, field)
	}

	if code, field := appCode(PasswordChangeRequest{"old", "short"}.Validate()); code != "password_too_short" || field != "new_password" {
		t.Errorf("short new: got (%q, %q)", code, field)
	}

	if err := (PasswordChangeRequest{"old", "longenough"}).Validate(); err != nil {
		t.Errorf("valid: %v", err)
	}
}
