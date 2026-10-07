-- name: ListCategories :many
SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    (SELECT count(*) FROM incidents i WHERE i.category_id = c.id) AS incident_count
FROM categories c
ORDER BY c.name;

-- name: GetCategoryIDBySlug :one
SELECT id
FROM categories
WHERE slug = sqlc.arg(slug);

-- name: GetCategoryBySlug :one
SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    (SELECT count(*) FROM incidents i WHERE i.category_id = c.id) AS incident_count
FROM categories c
WHERE c.slug = sqlc.arg(slug);

-- name: CategoryNameTaken :one
-- Case-insensitive, so "Docker" and "docker" can't coexist. exclude_slug
-- skips the category being renamed ('' to check against all of them).
SELECT EXISTS (
    SELECT 1
    FROM categories
    WHERE lower(name) = lower(sqlc.arg(name)) AND slug <> sqlc.arg(exclude_slug)
);

-- name: CategorySlugExists :one
SELECT EXISTS (SELECT 1 FROM categories WHERE slug = sqlc.arg(slug));

-- name: CreateCategory :exec
INSERT INTO categories (name, slug, description)
VALUES (sqlc.arg(name), sqlc.arg(slug), sqlc.arg(description));

-- name: UpdateCategory :execrows
-- The slug is left unchanged so filters and links keep working.
UPDATE categories
SET name        = sqlc.arg(name),
    description = sqlc.arg(description)
WHERE slug = sqlc.arg(slug);

-- name: DeleteCategory :execrows
-- Fails with a foreign key violation while incidents still use it.
DELETE FROM categories
WHERE slug = sqlc.arg(slug);
