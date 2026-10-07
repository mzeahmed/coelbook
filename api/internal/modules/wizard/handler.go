package wizard

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/mzeahmed/coelbook/internal/apperr"
	"github.com/mzeahmed/coelbook/internal/response"
)

// Handler handles all HTTP requests related to the wizard module.
type Handler struct {
	service *Service
}

// NewHandler creates a new wizard handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Status handles GET /setup/status.
func (h *Handler) Status(w http.ResponseWriter, r *http.Request) {

	initialized, err := h.service.Status(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")

		return
	}

	message := "instance is not initialized"
	if initialized {
		message = "instance is initialized"
	}

	response.JSON(w, http.StatusOK, message, StatusResponse{Initialized: initialized})
}

// Setup handles POST /setup.
func (h *Handler) Setup(w http.ResponseWriter, r *http.Request) {

	var req SetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, apperr.CodeInvalidRequestBody, "invalid request body")

		return
	}

	if err := req.Validate(); err != nil {
		response.AppError(w, http.StatusBadRequest, err)

		return
	}

	if err := h.service.Setup(r.Context(), req); err != nil {
		if errors.Is(err, ErrAlreadyInitialized) {
			response.AppError(w, http.StatusConflict, ErrAlreadyInitialized)

			return
		}

		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")

		return
	}

	response.JSON(w, http.StatusCreated, "setup completed", nil)
}
