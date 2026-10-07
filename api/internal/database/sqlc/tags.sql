-- name: UpsertTag :one
-- Returns the id of the tag with this slug, creating it if needed. The
-- no-op update makes RETURNING yield the existing row on conflict.
INSERT INTO tags (name, slug)
VALUES (sqlc.arg(name), sqlc.arg(slug))
ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
RETURNING id;

-- name: DeleteIncidentTags :exec
DELETE FROM incident_tags
WHERE incident_id = sqlc.arg(incident_id);

-- name: AddIncidentTag :exec
INSERT INTO incident_tags (incident_id, tag_id)
VALUES (sqlc.arg(incident_id), sqlc.arg(tag_id))
ON CONFLICT DO NOTHING;
