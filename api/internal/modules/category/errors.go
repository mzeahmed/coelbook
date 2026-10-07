package category

import "github.com/mzeahmed/coelbook/internal/apperr"

// ErrNotFound is returned when no category matches the requested slug.
var ErrNotFound = apperr.New("category_not_found", "category not found")

// ErrNameTaken is returned when another category already has the same
// name, compared case-insensitively.
var ErrNameTaken = apperr.NewField("category_name_taken", "name", "a category with this name already exists")

// ErrInUse is returned when deleting a category that incidents still use.
var ErrInUse = apperr.New("category_in_use", "category is used by incidents")
