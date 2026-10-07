-- name: CountIncidentsByStatus :many
SELECT status, count(*) AS total
FROM incidents
GROUP BY status;

-- name: TopTags :many
SELECT t.name, t.slug, count(*) AS incident_count
FROM incident_tags it
JOIN tags t ON t.id = it.tag_id
GROUP BY t.id, t.name, t.slug
ORDER BY incident_count DESC, t.name
LIMIT sqlc.arg(max_tags);

-- name: RecentlyUpdatedIncidents :many
SELECT
    i.title,
    i.slug,
    i.status,
    i.updated_at,
    c.name AS category_name,
    c.slug AS category_slug
FROM incidents i
JOIN categories c ON c.id = i.category_id
ORDER BY i.updated_at DESC, i.id DESC
LIMIT sqlc.arg(max_incidents);

-- name: WeeklyIncidentCreations :many
-- One row per week (Monday-based, in the database's time zone) for the
-- last `weeks` weeks including the current one, oldest first; weeks with
-- no incident are included with a zero count.
SELECT
    w.week_start::date AS week_start,
    count(i.id) AS total
FROM generate_series(
        date_trunc('week', now()) - (sqlc.arg(weeks)::int - 1) * interval '1 week',
        date_trunc('week', now()),
        interval '1 week'
    ) AS w(week_start)
LEFT JOIN incidents i
    ON i.created_at >= w.week_start AND i.created_at < w.week_start + interval '1 week'
GROUP BY w.week_start
ORDER BY w.week_start;
