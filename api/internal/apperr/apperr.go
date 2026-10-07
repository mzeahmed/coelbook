// Package apperr defines errors that carry a stable, machine-readable code
// next to their human-readable message.
//
// The code is part of the API contract: it is returned in the "error"
// field of the response envelope so clients can react to (and translate)
// a specific failure without parsing the English message, which may
// change freely.
package apperr

// Codes shared by every module. Module-specific codes are declared next to
// the errors that use them.
const (
	CodeInvalidRequestBody = "invalid_request_body"
	CodeInternal           = "internal_error"
	CodeMissingToken       = "missing_token"
	CodeInvalidToken       = "invalid_token"
	CodeRouteNotFound      = "route_not_found"
	CodeMethodNotAllowed   = "method_not_allowed"
)

// Error is an error with a stable code. Its message is meant for
// developers and logs; clients should rely on Code.
//
// Field, when set, is the path of the request field the error is about,
// using dots for nesting and brackets for list indexes (e.g. "title",
// "snippets[2].content"), so forms can attach the error to the right
// input.
type Error struct {
	Code    string
	Message string
	Field   string
}

// New returns an *Error with the given code and message.
func New(code, message string) *Error {
	return &Error{Code: code, Message: message}
}

// NewField returns an *Error about the request field at path field.
func NewField(code, field, message string) *Error {
	return &Error{Code: code, Message: message, Field: field}
}

func (e *Error) Error() string {
	return e.Message
}
