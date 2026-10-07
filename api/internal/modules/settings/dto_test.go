package settings

import (
	"errors"
	"testing"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

func TestSettingsValidate(t *testing.T) {
	valid := Settings{InstanceName: "Acme", Timezone: "Europe/Paris", Locale: "fr"}

	tests := []struct {
		name   string
		mutate func(s *Settings)
		want   string
	}{
		{"valid", func(s *Settings) {}, ""},
		{"blank name", func(s *Settings) { s.InstanceName = " " }, "instance_name_required"},
		{"blank timezone", func(s *Settings) { s.Timezone = "" }, "instance_timezone_required"},
		{"unknown timezone", func(s *Settings) { s.Timezone = "Mars/Olympus" }, "invalid_timezone"},
		{"Local is not a zone", func(s *Settings) { s.Timezone = "Local" }, "invalid_timezone"},
		{"UTC", func(s *Settings) { s.Timezone = "UTC" }, ""},
		{"unsupported locale", func(s *Settings) { s.Locale = "xx" }, "invalid_locale"},
	}

	for _, tt := range tests {
		s := valid
		tt.mutate(&s)

		var appErr *apperr.Error
		got := ""
		if err := s.Validate(); errors.As(err, &appErr) {
			got = appErr.Code
		}

		if got != tt.want {
			t.Errorf("%s: code = %q, want %q", tt.name, got, tt.want)
		}
	}
}
