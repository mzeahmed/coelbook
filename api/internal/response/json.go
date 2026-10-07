// Package response provides helper functions to write consistent HTTP
// responses across the application.
package response

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

// Envelope is the standard JSON shape returned by every API response.
//
// Error is a stable, machine-readable code (e.g. "title_required") set on
// error responses only; clients should branch on it rather than on
// Message, which is a developer-facing English description.
type Envelope struct {
	Code    int    `json:"code"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

// JSON writes data wrapped in the standard Envelope, with the given HTTP
// status code and message. Success is true for 2xx status codes, false
// otherwise.
//
// It sets the Content-Type header, writes the status code, and serializes
// the envelope using the standard JSON encoder.
func JSON(w http.ResponseWriter, status int, message string, data any) {
	write(w, Envelope{
		Code:    status,
		Success: status >= 200 && status < 300,
		Message: message,
		Data:    data,
	})
}

// Error writes the standard envelope for a failure, with the given HTTP
// status, error code and message, and no data.
func Error(w http.ResponseWriter, status int, code, msg string) {
	write(w, Envelope{
		Code:    status,
		Success: false,
		Error:   code,
		Message: msg,
	})
}

// AppError writes err as a failure with the given HTTP status, taking the
// code and message from the *apperr.Error it wraps. Any other error is
// reported as a generic internal error so its details never leak.
func AppError(w http.ResponseWriter, status int, err error) {

	var appErr *apperr.Error
	if errors.As(err, &appErr) {
		Error(w, status, appErr.Code, appErr.Message)

		return
	}

	Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")
}

func write(w http.ResponseWriter, env Envelope) {

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(env.Code)

	_ = json.NewEncoder(w).Encode(env)
}
