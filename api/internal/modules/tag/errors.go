package tag

import "github.com/mzeahmed/coelbook/internal/apperr"

// ErrNotFound is returned when no tag matches the requested slug.
var ErrNotFound = apperr.New("tag_not_found", "tag not found")

// ErrNameInvalid is returned when a name has no letter or digit, so no
// slug can be derived from it.
var ErrNameInvalid = apperr.NewField("tag_name_invalid", "name", "name must contain a letter or a digit")

// ErrExists is returned when renaming a tag to a name whose slug belongs
// to another tag; the client can offer to merge them instead.
var ErrExists = apperr.NewField("tag_exists", "name", "another tag already has this name")

// ErrMergeIntoItself is returned when a tag is merged into itself.
var ErrMergeIntoItself = apperr.NewField("tag_merge_into_itself", "into", "a tag can't be merged into itself")
