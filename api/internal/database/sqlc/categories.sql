-- name: ListCategories :many
SELECT id, name, slug
FROM categories
ORDER BY name;

-- name: GetCategoryIDBySlug :one
SELECT id
FROM categories
WHERE slug = sqlc.arg(slug);
