-- +goose Up
-- Change history of incidents: every create or update that changes
-- something records a full snapshot of the incident, so any two versions
-- can be compared later. Snapshots are small JSON documents (text only), so
-- every version is kept.

-- incident_snapshot is the single definition of what a version contains:
-- the editable content of the incident, its tags, snippets and links, in a
-- stable order. Used by the backfill below and by the API on each write.
-- +goose StatementBegin
CREATE FUNCTION incident_snapshot(incident_id BIGINT) RETURNS jsonb
    LANGUAGE sql
    STABLE
AS $$
SELECT jsonb_build_object(
    'title', i.title,
    'summary', coalesce(i.summary, ''),
    'problem', coalesce(i.problem, ''),
    'diagnosis', coalesce(i.diagnosis, ''),
    'root_cause', coalesce(i.root_cause, ''),
    'solution', coalesce(i.solution, ''),
    'prevention', coalesce(i.prevention, ''),
    'status', i.status,
    'category', jsonb_build_object('name', c.name, 'slug', c.slug),
    'tags', coalesce(
        (SELECT jsonb_agg(t.name ORDER BY t.name)
         FROM incident_tags it
         JOIN tags t ON t.id = it.tag_id
         WHERE it.incident_id = i.id), '[]'::jsonb),
    'snippets', coalesce(
        (SELECT jsonb_agg(jsonb_build_object('title', s.title, 'language', s.language, 'content', s.content)
                          ORDER BY s."order", s.id)
         FROM snippets s
         WHERE s.incident_id = i.id), '[]'::jsonb),
    'links', coalesce(
        (SELECT jsonb_agg(jsonb_build_object('title', l.title, 'url', l.url) ORDER BY l.id)
         FROM links l
         WHERE l.incident_id = i.id), '[]'::jsonb)
)
FROM incidents i
JOIN categories c ON c.id = i.category_id
WHERE i.id = incident_id;
$$;
-- +goose StatementEnd

CREATE TABLE incident_versions
(
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    incident_id    BIGINT      NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
    version        INTEGER     NOT NULL,
    snapshot       JSONB       NOT NULL,
    changed_fields TEXT[]      NOT NULL DEFAULT '{}',
    author_id      BIGINT      REFERENCES users (id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (incident_id, version)
);

COMMENT ON TABLE incident_versions IS 'Snapshots of an incident after each change, for its history.';
COMMENT ON COLUMN incident_versions.version IS 'Version number within the incident, from 1.';
COMMENT ON COLUMN incident_versions.snapshot IS 'Full content at that version (see incident_snapshot()).';
COMMENT ON COLUMN incident_versions.changed_fields IS 'Snapshot keys that differ from the previous version; empty for version 1.';
COMMENT ON COLUMN incident_versions.author_id IS 'User who made the change; NULL if they were deleted.';

-- Existing incidents start their history with their current state, dated
-- from their last update and credited to their author.
INSERT INTO incident_versions (incident_id, version, snapshot, author_id, created_at)
SELECT i.id, 1, incident_snapshot(i.id), i.created_by, i.updated_at
FROM incidents i;

-- +goose Down
DROP TABLE incident_versions;
DROP FUNCTION incident_snapshot(BIGINT);
