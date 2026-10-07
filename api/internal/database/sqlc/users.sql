-- name: FindUserByEmail :one
SELECT *
FROM users
WHERE email = $1;

-- name: FindUserById :one
SELECT *
FROM users
WHERE id = $1;

-- name: CreateUser :one
INSERT INTO users (email, password_hash, first_name, last_name)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: HasUser :one
SELECT EXISTS (SELECT 1 FROM users) AS exists;

-- name: InvalidatePasswordResetTokens :exec
UPDATE password_reset_tokens
SET used_at = now()
WHERE user_id = $1
  AND used_at IS NULL;

-- name: CreatePasswordResetToken :one
INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetValidPasswordResetTokenForUpdate :one
SELECT id, user_id
FROM password_reset_tokens
WHERE token_hash = $1
  AND used_at IS NULL
  AND expires_at > now()
FOR UPDATE;

-- name: ConsumePasswordResetToken :exec
UPDATE password_reset_tokens
SET used_at = now()
WHERE id = $1
  AND used_at IS NULL;

-- name: UpdateUserPasswordAndSessionVersion :exec
UPDATE users
SET password_hash   = $2,
    session_version = session_version + 1,
    updated_at      = now()
WHERE id = $1;
