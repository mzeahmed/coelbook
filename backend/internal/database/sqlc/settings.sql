-- name: GetSettings :one
SELECT *
FROM settings
LIMIT 1;

-- name: CreateSettings :one
INSERT INTO settings (instance_name, timezone, locale)
VALUES ($1, $2, $3)
RETURNING *;

-- name: DeleteSettings :exec
DELETE FROM settings;