package category

import (
	"net/http"

	"github.com/mzeahmed/coelbook/internal/response"
)

// Handler handles all HTTP requests related to the category module.
type Handler struct {
	service *Service
}

// NewHandler creates a new category handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List handles GET /categories.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {

	categories, err := h.service.List(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "internal server error")

		return
	}

	response.JSON(w, http.StatusOK, "", categories)
}
