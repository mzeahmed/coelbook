-- name: GetWizard :one
SELECT *
FROM wizard
LIMIT 1;

-- name: CreateWizard :one
INSERT INTO wizard (instance_name, timezone, locale)
VALUES ($1, $2, $3)
RETURNING *;

-- name: DeleteWizard :exec
DELETE FROM wizard;
-- name: UpdateWizard :one
UPDATE wizard
SET instance_name = sqlc.arg(instance_name),
    timezone      = sqlc.arg(timezone),
    locale        = sqlc.arg(locale)
RETURNING *;
