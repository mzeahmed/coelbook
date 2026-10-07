package settings

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/mzeahmed/coelbook/internal/apperr"
	"github.com/mzeahmed/coelbook/internal/response"
)

// Handler handles all HTTP requests related to the settings module.
type Handler struct {
	service *Service
}

// NewHandler creates a new settings handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Get handles GET /settings.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {

	res, err := h.service.Get(r.Context())
	if err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "", res)
}

// Update handles PUT /settings.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {

	var req Settings
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, apperr.CodeInvalidRequestBody, "invalid request body")

		return
	}

	if err := req.Validate(); err != nil {
		response.AppError(w, http.StatusBadRequest, err)

		return
	}

	res, err := h.service.Update(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "settings updated", res)
}

func writeServiceError(w http.ResponseWriter, err error) {

	if errors.Is(err, ErrNotInitialized) {
		response.AppError(w, http.StatusConflict, err)

		return
	}

	response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")
}
