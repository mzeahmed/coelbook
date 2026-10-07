package incident

import "github.com/mzeahmed/coelbook/internal/apperr"

// ErrNotFound is returned when no incident matches the requested slug.
var ErrNotFound = apperr.New("incident_not_found", "incident not found")

// ErrUnknownCategory is returned when a write request references a
// category slug that doesn't exist.
var ErrUnknownCategory = apperr.New("unknown_category", "unknown category")
