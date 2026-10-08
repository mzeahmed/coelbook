-- name: FindUserByEmail :one
-- Case-insensitive: an address is the same whatever case it is typed in
-- (see the users_email_lower_key index).
SELECT *
FROM users
WHERE lower(email) = lower(sqlc.arg(email));

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

-- name: EmailTakenByOtherUser :one
-- Case-insensitive, like the address a user would type to sign in.
SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE lower(email) = lower(sqlc.arg(email)) AND id <> sqlc.arg(user_id)
);

-- name: UpdateUserProfile :one
UPDATE users
SET first_name = sqlc.arg(first_name),
    last_name  = sqlc.arg(last_name),
    email      = sqlc.arg(email),
    updated_at = now()
WHERE id = sqlc.arg(id)
RETURNING *;
