-- +goose Up
CREATE TABLE attachments
(
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    incident_id BIGINT      NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
    filename    TEXT        NOT NULL,
    mime        TEXT        NOT NULL,
    size        INTEGER     NOT NULL,
    path        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_incident_id ON attachments (incident_id);

COMMENT ON TABLE attachments IS 'Files associated with an incident.';
COMMENT ON COLUMN attachments.id IS 'Primary key.';
COMMENT ON COLUMN attachments.incident_id IS 'Incident the attachment belongs to.';
COMMENT ON COLUMN attachments.filename IS 'Original file name.';
COMMENT ON COLUMN attachments.mime IS 'MIME type.';
COMMENT ON COLUMN attachments.size IS 'File size in bytes.';
COMMENT ON COLUMN attachments.path IS 'Storage path.';
COMMENT ON COLUMN attachments.created_at IS 'Creation date.';

-- +goose Down
DROP TABLE attachments;