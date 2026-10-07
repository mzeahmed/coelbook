-- +goose Up
CREATE TABLE incident_tags
(
    incident_id BIGINT NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
    tag_id      BIGINT NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (incident_id, tag_id)
);

CREATE INDEX idx_incident_tags_tag_id ON incident_tags (tag_id);

COMMENT ON TABLE incident_tags IS 'Many-to-many relationship between incidents and tags.';
COMMENT ON COLUMN incident_tags.incident_id IS 'Referenced incident.';
COMMENT ON COLUMN incident_tags.tag_id IS 'Referenced tag.';

-- +goose Down
DROP TABLE incident_tags;