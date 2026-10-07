package middleware

import (
	"net/http"

	"github.com/mzeahmed/coelbook/internal/response"
)

// notFoundResponseWriter wraps http.ResponseWriter to detect the plain text
// 404/405 responses written internally by http.ServeMux (when no route, or
// no matching method, is found) and suppress their body so it can be
// replaced with the standard JSON envelope.
//
// Handlers that explicitly write their own 404/405 via response.JSON are
// left untouched: they set the Content-Type header to "application/json"
// before calling WriteHeader, which this writer detects and passes through
// unmodified.
type notFoundResponseWriter struct {
	http.ResponseWriter
	status      int
	intercepted bool
}

func (w *notFoundResponseWriter) WriteHeader(status int) {
	w.status = status

	if (status == http.StatusNotFound || status == http.StatusMethodNotAllowed) &&
		w.Header().Get("Content-Type") != "application/json" {
		w.intercepted = true

		return
	}

	w.ResponseWriter.WriteHeader(status)
}

func (w *notFoundResponseWriter) Write(b []byte) (int, error) {
	if w.intercepted {
		return len(b), nil
	}

	return w.ResponseWriter.Write(b)
}

// NotFound returns a middleware that rewrites http.ServeMux's built-in
// plain text 404 (no matching route) and 405 (matching route, wrong method)
// responses into the standard JSON envelope.
func NotFound(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		nw := &notFoundResponseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(nw, r)

		if !nw.intercepted {
			return
		}

		switch nw.status {
		case http.StatusNotFound:
			response.Error(w, http.StatusNotFound, "route not found")
		case http.StatusMethodNotAllowed:
			response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	})
}
