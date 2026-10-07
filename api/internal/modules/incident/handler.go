package incident

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/mzeahmed/coelbook/internal/reqctx"
	"github.com/mzeahmed/coelbook/internal/response"
)

// Handler handles all HTTP requests related to the incident module.
type Handler struct {
	service *Service
}

// NewHandler creates a new incident handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List handles GET /incidents.
//
// Supported query parameters: category, status, tag and q (all optional
// filters), plus page and per_page for pagination.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {

	query := r.URL.Query()

	filter := ListFilter{
		Category: query.Get("category"),
		Status:   query.Get("status"),
		Tag:      query.Get("tag"),
		Query:    query.Get("q"),
		Page:     atoiOrZero(query.Get("page")),
		PerPage:  atoiOrZero(query.Get("per_page")),
	}

	res, err := h.service.List(r.Context(), filter)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "internal server error")

		return
	}

	response.JSON(w, http.StatusOK, "", res)
}

// Get handles GET /incidents/{slug}.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {

	res, err := h.service.Get(r.Context(), r.PathValue("slug"))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.Error(w, http.StatusNotFound, ErrNotFound.Error())

			return
		}

		response.Error(w, http.StatusInternalServerError, "internal server error")

		return
	}

	response.JSON(w, http.StatusOK, "", res)
}

// Create handles POST /incidents. The authenticated caller becomes the
// incident's author.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {

	user, ok := reqctx.AuthUserFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "missing bearer token")

		return
	}

	userID, err := strconv.ParseInt(user.ID, 10, 64)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid token subject")

		return
	}

	req, ok := decodeWriteRequest(w, r)
	if !ok {
		return
	}

	res, err := h.service.Create(r.Context(), userID, req)
	if err != nil {
		writeServiceError(w, err)

		return
	}

	response.JSON(w, http.StatusCreated, "incident created", res)
}

// Update handles PUT /incidents/{slug}.
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

	response.JSON(w, http.StatusOK, "incident updated", res)
}

// decodeWriteRequest decodes and validates the body of a create or update
// request, writing a 400 response and returning false if it is unusable.
func decodeWriteRequest(w http.ResponseWriter, r *http.Request) (WriteRequest, bool) {

	var req WriteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")

		return WriteRequest{}, false
	}

	if err := req.Validate(); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())

		return WriteRequest{}, false
	}

	return req, true
}

// writeServiceError maps an error returned by a write operation of the
// service to the matching HTTP response.
func writeServiceError(w http.ResponseWriter, err error) {

	switch {
	case errors.Is(err, ErrNotFound):
		response.Error(w, http.StatusNotFound, ErrNotFound.Error())
	case errors.Is(err, ErrUnknownCategory):
		response.Error(w, http.StatusBadRequest, ErrUnknownCategory.Error())
	default:
		response.Error(w, http.StatusInternalServerError, "internal server error")
	}
}

// atoiOrZero parses s as an int, returning 0 (treated as "unset" by the
// service, which then falls back to its default) if s is empty or invalid.
func atoiOrZero(s string) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}

	return n
}
