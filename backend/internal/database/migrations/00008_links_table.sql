-- +goose Up
CREATE TABLE links
(
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL
);

CREATE INDEX idx_links_incident_id ON links (incident_id);

COMMENT ON TABLE links IS 'External resources referenced by an incident.';
COMMENT ON COLUMN links.id IS 'Primary key.';
COMMENT ON COLUMN links.incident_id IS 'Incident the link belongs to.';
COMMENT ON COLUMN links.title IS 'Link title.';
COMMENT ON COLUMN links.url IS 'Link URL.';

-- +goose Down
DROP TABLE links;