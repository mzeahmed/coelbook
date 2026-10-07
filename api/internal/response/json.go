// Package response provides helper functions to write consistent HTTP
// responses across the application.
package response

import (
	"encoding/json"
	"net/http"
)

// Envelope is the standard JSON shape returned by every API response.
type Envelope struct {
	Code    int    `json:"code"`
	Success bool   `json:"success"`
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	env := Envelope{
		Code:    status,
		Success: status >= 200 && status < 300,
		Message: message,
		Data:    data,
	}

	_ = json.NewEncoder(w).Encode(env)
}

// Error is a convenience wrapper around JSON that writes the standard
// envelope with the given message and no data, with the given status code.
func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, msg, nil)
}
