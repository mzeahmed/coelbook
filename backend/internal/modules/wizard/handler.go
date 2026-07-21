package wizard

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/mzeahmed/playbook/internal/response"
)

// Handler handles all HTTP requests related to the wizard module.
type Handler struct {
	service *Service
}

// NewHandler creates a new wizard handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Status handles GET /api/setup/status.
func (h *Handler) Status(w http.ResponseWriter, r *http.Request) {

	initialized, err := h.service.Status(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "internal server error")

		return
	}

	message := "instance is not initialized"
	if initialized {
		message = "instance is initialized"
	}

	response.JSON(w, http.StatusOK, message, StatusResponse{Initialized: initialized})
}

// Setup handles POST /api/setup.
func (h *Handler) Setup(w http.ResponseWriter, r *http.Request) {

	var req SetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")

		return
	}

	if err := req.Validate(); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())

		return
	}

	if err := h.service.Setup(r.Context(), req); err != nil {
		if errors.Is(err, ErrAlreadyInitialized) {
			response.Error(w, http.StatusConflict, "application is already initialized")

			return
		}

		response.Error(w, http.StatusInternalServerError, "internal server error")

		return
	}

	response.JSON(w, http.StatusCreated, "setup completed", nil)
}
