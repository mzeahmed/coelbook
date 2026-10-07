-- name: ListIncidents :many
-- With a query, results are ordered by full-text relevance, and the title
-- and summary come back with matched terms wrapped in U+E000 / U+E001
-- (private-use characters, so they can't clash with real content and
-- the client renders them as highlights without parsing HTML). Without a
-- query, results are ordered by date and the highlight columns are empty.
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
    ) AS tags,
    (CASE WHEN sqlc.arg(query)::text = '' THEN ''
        ELSE ts_headline('coelbook', i.title, websearch_to_tsquery('coelbook', sqlc.arg(query)::text),
            'HighlightAll=true, StartSel=' || chr(57344) || ', StopSel=' || chr(57345))
    END)::text AS title_highlight,
    (CASE WHEN sqlc.arg(query)::text = '' THEN ''
        ELSE ts_headline('coelbook', coalesce(i.summary, ''), websearch_to_tsquery('coelbook', sqlc.arg(query)::text),
            'HighlightAll=true, StartSel=' || chr(57344) || ', StopSel=' || chr(57345))
    END)::text AS summary_highlight
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
    AND (sqlc.arg(query)::text = ''
        OR i.search_vector @@ websearch_to_tsquery('coelbook', sqlc.arg(query)::text)
        -- Substring fallbacks: partial words while typing ("postg"), and
        -- snippet content, which is code and isn't in search_vector.
        OR i.title ILIKE '%' || sqlc.arg(query)::text || '%'
        OR i.summary ILIKE '%' || sqlc.arg(query)::text || '%'
        OR EXISTS (
            SELECT 1
            FROM snippets s
            WHERE s.incident_id = i.id AND s.content ILIKE '%' || sqlc.arg(query)::text || '%'
        ))
ORDER BY
    (CASE WHEN sqlc.arg(query)::text = '' THEN 0
        ELSE ts_rank(i.search_vector, websearch_to_tsquery('coelbook', sqlc.arg(query)::text))
    END) DESC,
    i.created_at DESC
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
    AND (sqlc.arg(query)::text = ''
        OR i.search_vector @@ websearch_to_tsquery('coelbook', sqlc.arg(query)::text)
        -- Substring fallbacks: partial words while typing ("postg"), and
        -- snippet content, which is code and isn't in search_vector.
        OR i.title ILIKE '%' || sqlc.arg(query)::text || '%'
        OR i.summary ILIKE '%' || sqlc.arg(query)::text || '%'
        OR EXISTS (
            SELECT 1
            FROM snippets s
            WHERE s.incident_id = i.id AND s.content ILIKE '%' || sqlc.arg(query)::text || '%'
        ));

-- name: GetIncidentBySlug :one
SELECT
    i.id,
    i.title,
    i.slug,
    i.summary,
    i.problem,
    i.diagnosis,
    i.root_cause,
    i.solution,
    i.prevention,
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
WHERE i.slug = sqlc.arg(slug);

-- name: ListIncidentSnippets :many
SELECT id, title, language, content
FROM snippets
WHERE incident_id = sqlc.arg(incident_id)
ORDER BY "order", id;

-- name: ListIncidentLinks :many
SELECT id, title, url
FROM links
WHERE incident_id = sqlc.arg(incident_id)
ORDER BY id;

-- name: IncidentSlugExists :one
SELECT EXISTS (SELECT 1 FROM incidents WHERE slug = sqlc.arg(slug));

-- name: CreateIncident :one
INSERT INTO incidents (
    title, slug, summary, problem, diagnosis, root_cause, solution, prevention,
    status, category_id, created_by
)
VALUES (
    sqlc.arg(title), sqlc.arg(slug), sqlc.arg(summary), sqlc.arg(problem),
    sqlc.arg(diagnosis), sqlc.arg(root_cause), sqlc.arg(solution), sqlc.arg(prevention),
    sqlc.arg(status), sqlc.arg(category_id), sqlc.arg(created_by)
)
RETURNING id;

-- name: UpdateIncident :one
-- The slug is deliberately left unchanged so existing links keep working
-- when the title is edited.
UPDATE incidents
SET title       = sqlc.arg(title),
    summary     = sqlc.arg(summary),
    problem     = sqlc.arg(problem),
    diagnosis   = sqlc.arg(diagnosis),
    root_cause  = sqlc.arg(root_cause),
    solution    = sqlc.arg(solution),
    prevention  = sqlc.arg(prevention),
    status      = sqlc.arg(status),
    category_id = sqlc.arg(category_id),
    updated_at  = now()
WHERE slug = sqlc.arg(slug)
RETURNING id;

-- name: RefreshIncidentSearchVector :exec
-- Rebuilds the incident's full-text document; call it after any change to
-- the incident, its tags or its snippets (see incident_search_vector()).
UPDATE incidents
SET search_vector = incident_search_vector(id)
WHERE id = sqlc.arg(id);

-- name: RefreshIncidentSearchVectors :exec
-- Same as RefreshIncidentSearchVector for several incidents, e.g. every
-- incident whose tag was just renamed, merged or deleted.
UPDATE incidents
SET search_vector = incident_search_vector(id)
WHERE id = ANY (sqlc.arg(ids)::bigint[]);
