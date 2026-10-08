// Package web serves the built frontend next to the API, so a production
// deployment is a single process: the React app at "/", the API under
// "/api" (the prefix the frontend calls, which nginx strips in the
// development environment).
package web

import (
	"io/fs"
	"net/http"
	"os"
	"path"
	"strings"
)

// Handler routes "/api/…" to api (prefix stripped) and everything else to
// the static files in dir. Paths that aren't files fall back to index.html,
// so client-side routes such as /incidents/foo load the app — except under
// /assets/, where a missing file is a 404.
//
// "/health" also reaches the API, for container and load-balancer checks.
func Handler(api http.Handler, dir string) http.Handler {

	mux := http.NewServeMux()
	mux.Handle("/api/", http.StripPrefix("/api", api))
	mux.Handle("/health", api)
	mux.Handle("/", spa(os.DirFS(dir)))

	return mux
}

func spa(files fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		name := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")

		if name != "" && fs.ValidPath(name) {
			if info, err := fs.Stat(files, name); err == nil && !info.IsDir() {
				// Vite puts content-hashed bundles under assets/: their name
				// changes with their content, so they can be cached forever.
				if strings.HasPrefix(name, "assets/") {
					w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				}

				http.ServeFileFS(w, r, files, name)

				return
			}
		}

		// A missing bundle is a 404, not the app: a page cached from an older
		// release would otherwise get HTML back for a script and fail with a
		// confusing parse error.
		if strings.HasPrefix(name, "assets/") {
			http.NotFound(w, r)

			return
		}

		// index.html references the current bundles: always revalidate it so
		// a new release is picked up on the next load.
		w.Header().Set("Cache-Control", "no-cache")
		http.ServeFileFS(w, r, files, "index.html")
	})
}
