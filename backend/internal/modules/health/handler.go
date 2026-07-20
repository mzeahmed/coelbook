package health

import "net/http"

// Handler handles all HTTP requests related to the health module.
type Handler struct{}

// NewHandler creates a new health handler.
func NewHandler() *Handler {
	return &Handler{}
}

// Health handles GET /health.
func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}
