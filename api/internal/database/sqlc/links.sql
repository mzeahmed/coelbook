-- name: DeleteIncidentLinks :exec
DELETE FROM links
WHERE incident_id = sqlc.arg(incident_id);

-- name: CreateLink :exec
INSERT INTO links (incident_id, title, url)
VALUES (sqlc.arg(incident_id), sqlc.arg(title), sqlc.arg(url));
