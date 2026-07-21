package auth

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/mzeahmed/coelbook/internal/response"
)

// Handler handles all HTTP requests related to the auth module.
type Handler struct {
	service *Service
}

// NewHandler creates a new auth handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Login handles POST /api/auth/login.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {

	var req LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")

		return
	}

	if err := req.Validate(); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())

		return
	}

	res, err := h.service.Login(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			response.Error(w, http.StatusUnauthorized, ErrInvalidCredentials.Error())

			return
		}

		response.Error(w, http.StatusInternalServerError, "internal server error")

		return
	}

	response.JSON(w, http.StatusOK, "login successful", res)
}