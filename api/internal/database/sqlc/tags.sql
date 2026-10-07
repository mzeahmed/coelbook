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

-- name: ListUsedTags :many
-- Tags attached to at least one incident; orphans (left behind when an
-- incident drops its last use of a tag) are omitted.
SELECT t.id, t.name, t.slug
FROM tags t
WHERE EXISTS (SELECT 1 FROM incident_tags it WHERE it.tag_id = t.id)
ORDER BY t.name;

-- name: ListTagsWithCounts :many
-- Every tag with the number of incidents using it, unused ones included.
SELECT t.id, t.name, t.slug, count(it.incident_id) AS incident_count
FROM tags t
LEFT JOIN incident_tags it ON it.tag_id = t.id
GROUP BY t.id, t.name, t.slug
ORDER BY t.name;

-- name: GetTagBySlug :one
SELECT id, name, slug
FROM tags
WHERE slug = sqlc.arg(slug);

-- name: TagSlugExists :one
SELECT EXISTS (SELECT 1 FROM tags WHERE slug = sqlc.arg(slug));

-- name: RenameTag :exec
UPDATE tags
SET name = sqlc.arg(name),
    slug = sqlc.arg(slug)
WHERE id = sqlc.arg(id);

-- name: ListIncidentIDsForTag :many
SELECT incident_id
FROM incident_tags
WHERE tag_id = sqlc.arg(tag_id);

-- name: CopyIncidentTags :exec
-- Gives every incident tagged from_tag_id the tag to_tag_id too (merge);
-- incidents that already have both keep a single link.
INSERT INTO incident_tags (incident_id, tag_id)
SELECT src.incident_id, sqlc.arg(to_tag_id)::bigint
FROM incident_tags src
WHERE src.tag_id = sqlc.arg(from_tag_id)
ON CONFLICT DO NOTHING;

-- name: DeleteTag :exec
-- Its incident_tags rows go with it (ON DELETE CASCADE).
DELETE FROM tags
WHERE id = sqlc.arg(id);

-- name: DeleteUnusedTags :execrows
DELETE FROM tags t
WHERE NOT EXISTS (SELECT 1 FROM incident_tags it WHERE it.tag_id = t.id);
