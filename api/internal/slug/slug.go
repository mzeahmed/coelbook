// Package slug turns human-readable names into URL identifiers.
package slug

import (
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

// Make turns s into a lowercase, ASCII, dash-separated URL identifier,
// e.g. "Postgres: connexion refusée" → "postgres-connexion-refusee".
// Accents are stripped; any other non-alphanumeric run becomes a single
// dash. It returns "" if s has no alphanumeric characters.
func Make(s string) string {

	var b strings.Builder
	pendingDash := false

	for _, r := range norm.NFD.String(strings.ToLower(s)) {
		switch {
		case unicode.Is(unicode.Mn, r):
			// Combining mark left over from NFD decomposition (an accent).
			continue
		case r < unicode.MaxASCII && (unicode.IsLetter(r) || unicode.IsDigit(r)):
			if pendingDash && b.Len() > 0 {
				b.WriteByte('-')
			}
			pendingDash = false
			b.WriteRune(r)
		default:
			pendingDash = true
		}
	}

	return b.String()
}
