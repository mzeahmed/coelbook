-- +goose Up
CREATE TABLE users
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    first_name    TEXT        NOT NULL,
    last_name     TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Authenticated users of the application.';
COMMENT ON COLUMN users.id IS 'Primary key.';
COMMENT ON COLUMN users.email IS 'Unique email, used for authentication.';
COMMENT ON COLUMN users.password_hash IS 'Hashed password.';
COMMENT ON COLUMN users.first_name IS 'User firstname.';
COMMENT ON COLUMN users.last_name IS 'User lastname.';
COMMENT ON COLUMN users.created_at IS 'Creation date.';
COMMENT ON COLUMN users.updated_at IS 'Last update date.';

-- +goose Down
DROP TABLE users;
