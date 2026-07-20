-- name: FindUserByEmail :one
SELECT *
FROM users
WHERE email = $1;

-- name: FindUserById :one
SELECT *
FROM users
WHERE id = $1;
