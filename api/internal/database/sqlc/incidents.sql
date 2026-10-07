-- name: ListIncidents :many
SELECT
    i.id,
    i.title,
    i.slug,
    i.summary,
    i.status,
    i.created_at,
    i.updated_at,
    c.name AS category_name,
    c.slug AS category_slug,
    u.first_name AS author_first_name,
    u.last_name AS author_last_name,
    COALESCE(
        (SELECT array_agg(t.name ORDER BY t.name)
         FROM incident_tags it
         JOIN tags t ON t.id = it.tag_id
         WHERE it.incident_id = i.id),
        '{}'::text[]
    ) AS tags
FROM incidents i
JOIN categories c ON c.id = i.category_id
JOIN users u ON u.id = i.created_by
WHERE (sqlc.arg(category)::text = '' OR c.slug = sqlc.arg(category)::text)
    AND (sqlc.arg(status)::text = '' OR i.status::text = sqlc.arg(status)::text)
    AND (sqlc.arg(tag)::text = '' OR EXISTS (
        SELECT 1
        FROM incident_tags it2
        JOIN tags t2 ON t2.id = it2.tag_id
        WHERE it2.incident_id = i.id AND t2.slug = sqlc.arg(tag)::text
    ))
    AND (sqlc.arg(query)::text = '' OR i.title ILIKE '%' || sqlc.arg(query)::text || '%' OR i.summary ILIKE '%' || sqlc.arg(query)::text || '%')
ORDER BY i.created_at DESC
LIMIT sqlc.arg(page_limit) OFFSET sqlc.arg(page_offset);

-- name: CountIncidents :one
SELECT count(*)
FROM incidents i
JOIN categories c ON c.id = i.category_id
WHERE (sqlc.arg(category)::text = '' OR c.slug = sqlc.arg(category)::text)
    AND (sqlc.arg(status)::text = '' OR i.status::text = sqlc.arg(status)::text)
    AND (sqlc.arg(tag)::text = '' OR EXISTS (
        SELECT 1
        FROM incident_tags it2
        JOIN tags t2 ON t2.id = it2.tag_id
        WHERE it2.incident_id = i.id AND t2.slug = sqlc.arg(tag)::text
    ))
    AND (sqlc.arg(query)::text = '' OR i.title ILIKE '%' || sqlc.arg(query)::text || '%' OR i.summary ILIKE '%' || sqlc.arg(query)::text || '%');