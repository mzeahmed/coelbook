-- name: DeleteIncidentSnippets :exec
DELETE FROM snippets
WHERE incident_id = sqlc.arg(incident_id);

-- name: CreateSnippet :exec
INSERT INTO snippets (incident_id, title, language, content, "order")
VALUES (sqlc.arg(incident_id), sqlc.arg(title), sqlc.arg(language), sqlc.arg(content), sqlc.arg(position));
