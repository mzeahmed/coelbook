package stats

import (
	"net/http"

	"github.com/mzeahmed/coelbook/internal/apperr"
	"github.com/mzeahmed/coelbook/internal/response"
)

// Handler handles all HTTP requests related to the stats module.
type Handler struct {
	service *Service
}

// NewHandler creates a new stats handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Get handles GET /stats.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {

	res, err := h.service.Get(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")

		return
	}

	response.JSON(w, http.StatusOK, "", res)
}
