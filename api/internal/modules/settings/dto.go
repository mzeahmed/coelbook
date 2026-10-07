package settings

import (
	"fmt"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	// Embeds the IANA time zone database, so time zones validate even in a
	// minimal image without /usr/share/zoneinfo.
	_ "time/tzdata"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

const maxInstanceNameLength = 100

// Locales offers the same choice as the setup wizard.
var Locales = []string{"en", "fr", "es", "de"}

// Settings is the public representation of the instance settings, and the
// expected JSON body of PUT /settings.
type Settings struct {
	InstanceName string `json:"instance_name"`
	Timezone     string `json:"timezone"`
	Locale       string `json:"locale"`
}

// Validate checks that the settings are usable.
func (r Settings) Validate() error {

	name := strings.TrimSpace(r.InstanceName)
	if name == "" {
		return apperr.NewField("instance_name_required", "instance_name", "instance name is required")
	}

	if utf8.RuneCountInString(name) > maxInstanceNameLength {
		return apperr.NewField("instance_name_too_long", "instance_name", fmt.Sprintf("instance name must be at most %d characters", maxInstanceNameLength))
	}

	tz := strings.TrimSpace(r.Timezone)
	if tz == "" {
		return apperr.NewField("instance_timezone_required", "timezone", "time zone is required")
	}

	// LoadLocation also accepts "Local", which means nothing to anyone else.
	if _, err := time.LoadLocation(tz); err != nil || tz == "Local" {
		return apperr.NewField("invalid_timezone", "timezone", "unknown time zone")
	}

	if !slices.Contains(Locales, r.Locale) {
		return apperr.NewField("invalid_locale", "locale", "unsupported language")
	}

	return nil
}
