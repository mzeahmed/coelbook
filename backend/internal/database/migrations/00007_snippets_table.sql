-- +goose Up
CREATE TABLE snippets
(
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    incident_id BIGINT  NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    language    TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    "order"     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_snippets_incident_id ON snippets (incident_id);

COMMENT ON TABLE snippets IS 'Reusable code or command snippets attached to an incident.';
COMMENT ON COLUMN snippets.id IS 'Primary key.';
COMMENT ON COLUMN snippets.incident_id IS 'Incident the snippet belongs to.';
COMMENT ON COLUMN snippets.title IS 'Snippet title.';
COMMENT ON COLUMN snippets.language IS 'Language or format of the snippet content.';
COMMENT ON COLUMN snippets.content IS 'Snippet content.';
COMMENT ON COLUMN snippets."order" IS 'Display order within the incident.';

-- +goose Down
DROP TABLE snippets;