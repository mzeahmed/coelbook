package tag

import (
	"encoding/json"
	"errors"
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

// List handles GET /tags. ?include_unused=true also returns tags no
// incident uses.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {

	tags, err := h.service.List(r.Context(), r.URL.Query().Get("include_unused") == "true")
	if err != nil {
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")

		return
	}

	response.JSON(w, http.StatusOK, "", tags)
}

// Rename handles PUT /tags/{slug}.
func (h *Handler) Rename(w http.ResponseWriter, r *http.Request) {

	var req RenameRequest
	if !decode(w, r, &req) {
		return
	}

	res, err := h.service.Rename(r.Context(), r.PathValue("slug"), req)
	if err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "tag renamed", res)
}

// Merge handles POST /tags/{slug}/merge.
func (h *Handler) Merge(w http.ResponseWriter, r *http.Request) {

	var req MergeRequest
	if !decode(w, r, &req) {
		return
	}

	res, err := h.service.Merge(r.Context(), r.PathValue("slug"), req)
	if err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "tags merged", res)
}

// Delete handles DELETE /tags/{slug}.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {

	if err := h.service.Delete(r.Context(), r.PathValue("slug")); err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "tag deleted", nil)
}

// PurgeUnused handles DELETE /tags?unused=true. The parameter is required
// so a bare DELETE /tags can't be mistaken for "delete every tag".
func (h *Handler) PurgeUnused(w http.ResponseWriter, r *http.Request) {

	if r.URL.Query().Get("unused") != "true" {
		response.Error(w, http.StatusBadRequest, apperr.CodeInvalidRequestBody, "only unused tags can be deleted in bulk: pass unused=true")

		return
	}

	n, err := h.service.PurgeUnused(r.Context())
	if err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "unused tags deleted", PurgeResponse{Deleted: n})
}

// decode decodes the JSON body into req and validates it, writing a 400
// response and returning false if it is unusable.
func decode[T interface{ Validate() error }](w http.ResponseWriter, r *http.Request, req *T) bool {

	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		response.Error(w, http.StatusBadRequest, apperr.CodeInvalidRequestBody, "invalid request body")

		return false
	}

	if err := (*req).Validate(); err != nil {
		response.AppError(w, http.StatusBadRequest, err)

		return false
	}

	return true
}

// writeServiceError maps an error returned by the service to the matching
// HTTP response.
func writeServiceError(w http.ResponseWriter, err error) {

	switch {
	case errors.Is(err, ErrNotFound):
		response.AppError(w, http.StatusNotFound, err)
	case errors.Is(err, ErrExists):
		response.AppError(w, http.StatusConflict, err)
	case errors.Is(err, ErrNameInvalid), errors.Is(err, ErrMergeIntoItself):
		response.AppError(w, http.StatusBadRequest, err)
	default:
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")
	}
}
