package category

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/mzeahmed/coelbook/internal/apperr"
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
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")

		return
	}

	response.JSON(w, http.StatusOK, "", categories)
}

// Create handles POST /categories.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {

	req, ok := decodeWriteRequest(w, r)
	if !ok {
		return
	}

	res, err := h.service.Create(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusCreated, "category created", res)
}

// Update handles PUT /categories/{slug}.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {

	req, ok := decodeWriteRequest(w, r)
	if !ok {
		return
	}

	res, err := h.service.Update(r.Context(), r.PathValue("slug"), req)
	if err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "category updated", res)
}

// Delete handles DELETE /categories/{slug}.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {

	if err := h.service.Delete(r.Context(), r.PathValue("slug")); err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "category deleted", nil)
}

// decodeWriteRequest decodes and validates the body of a create or update
// request, writing a 400 response and returning false if it is unusable.
func decodeWriteRequest(w http.ResponseWriter, r *http.Request) (WriteRequest, bool) {

	var req WriteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, apperr.CodeInvalidRequestBody, "invalid request body")

		return WriteRequest{}, false
	}

	if err := req.Validate(); err != nil {
		response.AppError(w, http.StatusBadRequest, err)

		return WriteRequest{}, false
	}

	return req, true
}

// writeServiceError maps an error returned by a write operation of the
// service to the matching HTTP response.
func writeServiceError(w http.ResponseWriter, err error) {

	switch {
	case errors.Is(err, ErrNotFound):
		response.AppError(w, http.StatusNotFound, err)
	case errors.Is(err, ErrNameTaken), errors.Is(err, ErrInUse):
		response.AppError(w, http.StatusConflict, err)
	default:
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")
	}
}
