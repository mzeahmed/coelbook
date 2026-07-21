package auth

import (
	"context"
	"errors"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
	"github.com/mzeahmed/coelbook/internal/password"
)

// Service contains the business logic of the auth module.
type Service struct {
	pool      *pgxpool.Pool
	jwtSecret string
}

// NewService creates a new auth service.
func NewService(pool *pgxpool.Pool, jwtSecret string) *Service {
	return &Service{
		pool:      pool,
		jwtSecret: jwtSecret,
	}
}

// Login verifies the given credentials and returns an access token on
// success.
func (s *Service) Login(ctx context.Context, req LoginRequest) (Response, error) {

	u, err := repo.New(s.pool).FindUserByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Response{}, ErrInvalidCredentials
		}

		return Response{}, err
	}

	if err := password.Compare(u.PasswordHash, req.Password); err != nil {
		return Response{}, ErrInvalidCredentials
	}

	token, err := generateToken(s.jwtSecret, u)
	if err != nil {
		return Response{}, err
	}

	return Response{
		Token: token,
		User: UserResponse{
			ID:        strconv.FormatInt(u.ID, 10),
			Email:     u.Email,
			FirstName: u.FirstName,
			LastName:  u.LastName,
		},
	}, nil
}