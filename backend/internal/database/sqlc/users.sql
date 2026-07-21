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
