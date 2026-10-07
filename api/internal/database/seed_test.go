package database

import (
	"os"
	"regexp"
	"strings"
	"testing"

	"github.com/mzeahmed/coelbook/internal/slug"
)

// Seed migrations insert (name, slug) pairs by hand; the API finds an
// existing tag or category by slug.Make(name), so a mismatch would make
// the incident form create a duplicate instead of reusing the default.
func TestSeedMigrationSlugsMatchSlugMake(t *testing.T) {
	sql, err := os.ReadFile("migrations/00012_default_categories_and_tags.sql")
	if err != nil {
		t.Fatal(err)
	}

	// Only the Up section inserts pairs; Down lists bare slugs.
	up, _, found := strings.Cut(string(sql), "-- +goose Down")
	if !found {
		t.Fatal("no Down section found")
	}

	// ('name', 'slug' — the description, when present, follows.
	pairs := regexp.MustCompile(`\('([^']+)', '([^']+)'`).FindAllStringSubmatch(up, -1)
	if len(pairs) == 0 {
		t.Fatal("no (name, slug) pairs found")
	}

	for _, p := range pairs {
		if got := slug.Make(p[1]); got != p[2] {
			t.Errorf("%q has slug %q, slug.Make gives %q", p[1], p[2], got)
		}
	}

	t.Logf("%d seeded rows checked", len(pairs))
}
