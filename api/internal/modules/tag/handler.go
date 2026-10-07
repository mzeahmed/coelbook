package tag

import (
	"net/http"

	"github.com/mzeahmed/coelbook/internal/apperr"
	"github.com/mzeahmed/coelbook/internal/response"
)

// Handler handles all HTTP requests related to the tag module.
type Handler struct {
	service *Service
}

// NewHandler creates a new tag handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List handles GET /tags.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {

	tags, err := h.service.List(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")

		return
	}

	response.JSON(w, http.StatusOK, "", tags)
}
