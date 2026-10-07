package incident

import (
	"net/http"
	"strconv"

	"github.com/mzeahmed/coelbook/internal/response"
)

// Handler handles all HTTP requests related to the incident module.
type Handler struct {
	service *Service
}

// NewHandler creates a new incident handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List handles GET /incidents.
//
// Supported query parameters: category, status, tag and q (all optional
// filters), plus page and per_page for pagination.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {

	query := r.URL.Query()

	filter := ListFilter{
		Category: query.Get("category"),
		Status:   query.Get("status"),
		Tag:      query.Get("tag"),
		Query:    query.Get("q"),
		Page:     atoiOrZero(query.Get("page")),
		PerPage:  atoiOrZero(query.Get("per_page")),
	}

	res, err := h.service.List(r.Context(), filter)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "internal server error")

		return
	}

	response.JSON(w, http.StatusOK, "", res)
}

// atoiOrZero parses s as an int, returning 0 (treated as "unset" by the
// service, which then falls back to its default) if s is empty or invalid.
func atoiOrZero(s string) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}

	return n
}
