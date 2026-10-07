package incident

import "errors"

// ErrNotFound is returned when no incident matches the requested slug.
var ErrNotFound = errors.New("incident not found")

// ErrUnknownCategory is returned when a write request references a
// category slug that doesn't exist.
var ErrUnknownCategory = errors.New("unknown category")
