-- +goose Up
-- Email addresses are compared case-insensitively everywhere (sign-in,
-- password reset, profile update): make "Ada@example.com" and
-- "ada@example.com" impossible to hold by two accounts.
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

-- +goose Down
DROP INDEX users_email_lower_key;
