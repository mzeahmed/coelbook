-- +goose Up
CREATE TABLE categories
(
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT
);

COMMENT ON TABLE categories IS 'Technical domains used to group incidents.';
COMMENT ON COLUMN categories.id IS 'Primary key.';
COMMENT ON COLUMN categories.name IS 'Category name.';
COMMENT ON COLUMN categories.slug IS 'URL identifier.';
COMMENT ON COLUMN categories.description IS 'Category description.';

-- +goose Down
DROP TABLE categories;