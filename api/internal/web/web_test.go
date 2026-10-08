package web

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestHandler(t *testing.T) {
	dir := t.TempDir()
	must := func(err error) {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
	}
	must(os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html>app</html>"), 0o644))
	must(os.MkdirAll(filepath.Join(dir, "assets"), 0o755))
	must(os.WriteFile(filepath.Join(dir, "assets", "app-123.js"), []byte("console.log(1)"), 0o644))

	api := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.WriteString(w, "api:"+r.URL.Path)
	})
	h := Handler(api, dir)

	tests := []struct {
		path, wantBody, wantCache string
	}{
		{"/api/incidents", "api:/incidents", ""},
		{"/health", "api:/health", ""},
		{"/assets/app-123.js", "console.log(1)", "public, max-age=31536000, immutable"},
		{"/", "<html>app</html>", "no-cache"},
		{"/incidents/some-slug", "<html>app</html>", "no-cache"},
		{"/assets", "<html>app</html>", "no-cache"},
	}

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/assets/app-old.js", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("missing asset: got %d, want 404", rec.Code)
	}

	for _, tt := range tests {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, tt.path, nil))

		if rec.Code != http.StatusOK || rec.Body.String() != tt.wantBody || rec.Header().Get("Cache-Control") != tt.wantCache {
			t.Errorf("GET %s: got %d %q (cache %q), want 200 %q (cache %q)",
				tt.path, rec.Code, rec.Body.String(), rec.Header().Get("Cache-Control"), tt.wantBody, tt.wantCache)
		}
	}
}

// The mux already redirects unclean paths; the file handler must still
// never serve anything outside its directory if reached directly with one.
func TestSPAStaysInsideItsDirectory(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("app"), 0o644); err != nil {
		t.Fatal(err)
	}

	h := spa(os.DirFS(dir))

	for _, p := range []string{"/../../etc/passwd", "/..%2f..%2fetc/passwd", "/assets/../../etc/hostname"} {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.URL.Path = p
		h.ServeHTTP(rec, req)

		// net/http rejects ".." in the path itself (400); otherwise the
		// app's index.html is served. Never anything from outside dir.
		served := rec.Body.String()
		if !(rec.Code == http.StatusBadRequest || (rec.Code == http.StatusOK && served == "app")) {
			t.Errorf("%s: got %d %q", p, rec.Code, served)
		}
	}
}
