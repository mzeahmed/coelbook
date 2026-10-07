-- +goose Up
CREATE TYPE incident_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE incidents
(
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       TEXT            NOT NULL,
    slug        TEXT            NOT NULL UNIQUE,
    summary     TEXT,
    problem     TEXT,
    diagnosis   TEXT,
    root_cause  TEXT,
    solution    TEXT,
    prevention  TEXT,
    status      incident_status NOT NULL DEFAULT 'draft',
    category_id BIGINT          NOT NULL REFERENCES categories (id),
    created_by  BIGINT          NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_category_id ON incidents (category_id);
CREATE INDEX idx_incidents_created_by ON incidents (created_by);

COMMENT ON TABLE incidents IS 'Central entity documenting a technical problem and its resolution.';
COMMENT ON COLUMN incidents.id IS 'Primary key.';
COMMENT ON COLUMN incidents.title IS 'Short title.';
COMMENT ON COLUMN incidents.slug IS 'URL identifier.';
COMMENT ON COLUMN incidents.summary IS 'Short overview.';
COMMENT ON COLUMN incidents.problem IS 'Symptoms and observed behavior.';
COMMENT ON COLUMN incidents.diagnosis IS 'Investigation and reasoning.';
COMMENT ON COLUMN incidents.root_cause IS 'Root cause.';
COMMENT ON COLUMN incidents.solution IS 'Resolution steps.';
COMMENT ON COLUMN incidents.prevention IS 'How to avoid recurrence.';
COMMENT ON COLUMN incidents.status IS 'Lifecycle state: draft, published or archived.';
COMMENT ON COLUMN incidents.category_id IS 'Category the incident belongs to.';
COMMENT ON COLUMN incidents.created_by IS 'Author of the incident.';
COMMENT ON COLUMN incidents.created_at IS 'Creation date.';
COMMENT ON COLUMN incidents.updated_at IS 'Last update date.';

-- +goose Down
DROP TABLE incidents;
DROP TYPE incident_status;