package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
	"github.com/mzeahmed/coelbook/internal/mailer"
	"github.com/mzeahmed/coelbook/internal/password"
)

const passwordResetTTL = time.Hour

// Service contains the business logic of the auth module.
type Service struct {
	pool      *pgxpool.Pool
	jwtSecret string
	mailer    mailer.Sender
}

// NewService creates a new auth service.
func NewService(pool *pgxpool.Pool, jwtSecret string, sender mailer.Sender) *Service {
	return &Service{
		pool:      pool,
		jwtSecret: jwtSecret,
		mailer:    sender,
	}
}

// RequestPasswordReset creates a one-time token for a known account and sends
// it by email. Unknown accounts deliberately return success to avoid account
// enumeration.
func (s *Service) RequestPasswordReset(ctx context.Context, req PasswordResetRequest) error {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	user, err := repo.New(s.pool).FindUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return err
	}

	token, tokenHash, err := newPasswordResetToken()
	if err != nil {
		return err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := repo.New(tx)
	if err := q.InvalidatePasswordResetTokens(ctx, user.ID); err != nil {
		return err
	}
	if _, err := q.CreatePasswordResetToken(ctx, repo.CreatePasswordResetTokenParams{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(passwordResetTTL), Valid: true},
	}); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}

	return s.mailer.SendPasswordReset(ctx, user.Email, token)
}

// ResetPassword validates a one-time token, updates the password hash, and
// increments the user's session version so all existing JWTs are rejected.
func (s *Service) ResetPassword(ctx context.Context, req PasswordResetConfirmRequest) error {
	hash := hashPasswordResetToken(req.Token)

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := repo.New(tx)
	resetToken, err := q.GetValidPasswordResetTokenForUpdate(ctx, hash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrInvalidResetToken
		}
		return err
	}

	passwordHash, err := password.Hash(req.Password)
	if err != nil {
		return err
	}
	if err := q.ConsumePasswordResetToken(ctx, resetToken.ID); err != nil {
		return err
	}
	if err := q.InvalidatePasswordResetTokens(ctx, resetToken.UserID); err != nil {
		return err
	}
	if err := q.UpdateUserPasswordAndSessionVersion(ctx, repo.UpdateUserPasswordAndSessionVersionParams{
		ID:           resetToken.UserID,
		PasswordHash: passwordHash,
	}); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ValidateAccessToken verifies the JWT signature and confirms that it was
// issued for the user's current session version.
func (s *Service) ValidateAccessToken(ctx context.Context, token string) (string, error) {
	claims, err := ParseToken(s.jwtSecret, token)
	if err != nil {
		return "", err
	}

	userID, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return "", err
	}
	user, err := repo.New(s.pool).FindUserById(ctx, userID)
	if err != nil {
		return "", err
	}
	if user.SessionVersion != claims.SessionVersion {
		return "", errors.New("token session version is no longer valid")
	}

	return claims.Subject, nil
}

func newPasswordResetToken() (raw string, hash string, err error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", "", err
	}

	raw = base64.RawURLEncoding.EncodeToString(bytes)
	return raw, hashPasswordResetToken(raw), nil
}

func hashPasswordResetToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return base64.RawURLEncoding.EncodeToString(sum[:])
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
