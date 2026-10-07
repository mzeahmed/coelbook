package incident

import "errors"

// ErrNotFound is returned when no incident matches the requested slug.
var ErrNotFound = errors.New("incident not found")
