-- +goose Up
CREATE TABLE tags
(
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
);

COMMENT ON TABLE tags IS 'Flexible keywords used to classify incidents.';
COMMENT ON COLUMN tags.id IS 'Primary key.';
COMMENT ON COLUMN tags.name IS 'Tag name.';
COMMENT ON COLUMN tags.slug IS 'URL identifier.';

-- +goose Down
DROP TABLE tags;