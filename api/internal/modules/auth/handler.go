package auth

import (
	"encoding/json"
	"errors"
	"log"
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

// Login handles POST /auth/login.
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

// RequestPasswordReset handles POST /auth/password-reset.
func (h *Handler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req PasswordResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := req.Validate(); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.service.RequestPasswordReset(r.Context(), req); err != nil {
		// Keep the public response identical to prevent account enumeration.
		// Operators still receive the failure in the application log.
		log.Printf("request password reset: %v", err)
	}

	response.JSON(w, http.StatusAccepted, "if an account exists for this email, a reset link has been sent", nil)
}

// ConfirmPasswordReset handles POST /auth/password-reset/confirm.
func (h *Handler) ConfirmPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req PasswordResetConfirmRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := req.Validate(); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.service.ResetPassword(r.Context(), req); err != nil {
		if errors.Is(err, ErrInvalidResetToken) {
			response.Error(w, http.StatusBadRequest, ErrInvalidResetToken.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "unable to reset password")
		return
	}

	response.JSON(w, http.StatusOK, "password reset successful", nil)
}
