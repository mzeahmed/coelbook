package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/mail"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/mzeahmed/coelbook/internal/apperr"
	repo "github.com/mzeahmed/coelbook/internal/database/queries"
	"github.com/mzeahmed/coelbook/internal/password"
	"github.com/mzeahmed/coelbook/internal/reqctx"
	"github.com/mzeahmed/coelbook/internal/response"
)

// The signed-in user's own account: reading and editing the profile, and
// changing the password.

const (
	maxNameLength  = 100
	maxEmailLength = 254
	minPassword    = 8

	// uniqueViolation is the Postgres error code of a unique constraint
	// violation (here, users.email).
	uniqueViolation = "23505"
)

var (
	// ErrEmailTaken is returned when another account already uses the email.
	ErrEmailTaken = apperr.NewField("email_taken", "email", "another account already uses this email")

	// ErrWrongCurrentPassword is returned when changing the password with an
	// incorrect current one.
	ErrWrongCurrentPassword = apperr.NewField("wrong_current_password", "current_password", "current password is incorrect")
)

// ProfileRequest is the expected JSON body of PUT /account.
type ProfileRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

// Validate checks that the profile is usable.
func (r ProfileRequest) Validate() error {

	for _, f := range []struct{ value, field, code string }{
		{r.FirstName, "first_name", "first_name_required"},
		{r.LastName, "last_name", "last_name_required"},
	} {
		v := strings.TrimSpace(f.value)
		if v == "" {
			return apperr.NewField(f.code, f.field, fmt.Sprintf("%s is required", f.field))
		}

		if utf8.RuneCountInString(v) > maxNameLength {
			return apperr.NewField("name_too_long", f.field, fmt.Sprintf("%s must be at most %d characters", f.field, maxNameLength))
		}
	}

	email := strings.TrimSpace(r.Email)
	if email == "" {
		return apperr.NewField("email_required", "email", "email is required")
	}

	// mail.ParseAddress accepts "Name <a@b>" too; require the bare address.
	if addr, err := mail.ParseAddress(email); err != nil || addr.Address != email || len(email) > maxEmailLength {
		return apperr.NewField("invalid_email", "email", "email is not a valid address")
	}

	return nil
}

// PasswordChangeRequest is the expected JSON body of PUT /account/password.
type PasswordChangeRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// Validate checks that both passwords are given and the new one is long
// enough.
func (r PasswordChangeRequest) Validate() error {

	if r.CurrentPassword == "" {
		return apperr.NewField("current_password_required", "current_password", "current password is required")
	}

	if len(r.NewPassword) < minPassword {
		return apperr.NewField("password_too_short", "new_password", fmt.Sprintf("password must be at least %d characters", minPassword))
	}

	return nil
}

// TokenResponse is the response body of PUT /account/password: changing
// the password signs every session out, so the caller gets a fresh token.
type TokenResponse struct {
	Token string `json:"token"`
}

// Account returns the profile of the user with the given id.
func (s *Service) Account(ctx context.Context, userID int64) (UserResponse, error) {

	u, err := repo.New(s.pool).FindUserById(ctx, userID)
	if err != nil {
		return UserResponse{}, err
	}

	return toUserResponse(u), nil
}

// UpdateProfile replaces the user's name and email.
func (s *Service) UpdateProfile(ctx context.Context, userID int64, req ProfileRequest) (UserResponse, error) {

	q := repo.New(s.pool)
	email := strings.TrimSpace(req.Email)

	taken, err := q.EmailTakenByOtherUser(ctx, repo.EmailTakenByOtherUserParams{Email: email, UserID: userID})
	if err != nil {
		return UserResponse{}, err
	}

	if taken {
		return UserResponse{}, ErrEmailTaken
	}

	u, err := q.UpdateUserProfile(ctx, repo.UpdateUserProfileParams{
		ID:        userID,
		FirstName: strings.TrimSpace(req.FirstName),
		LastName:  strings.TrimSpace(req.LastName),
		Email:     email,
	})
	if err != nil {
		// A concurrent request may have taken the email since the check.
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == uniqueViolation {
			return UserResponse{}, ErrEmailTaken
		}

		return UserResponse{}, err
	}

	return toUserResponse(u), nil
}

// ChangePassword checks the current password, stores the new one and
// invalidates every existing token (the session version is bumped, as for
// a password reset). It returns a new token so the caller stays signed in;
// the user's other sessions are signed out.
func (s *Service) ChangePassword(ctx context.Context, userID int64, req PasswordChangeRequest) (TokenResponse, error) {

	q := repo.New(s.pool)

	u, err := q.FindUserById(ctx, userID)
	if err != nil {
		return TokenResponse{}, err
	}

	if err := password.Compare(u.PasswordHash, req.CurrentPassword); err != nil {
		return TokenResponse{}, ErrWrongCurrentPassword
	}

	hash, err := password.Hash(req.NewPassword)
	if err != nil {
		return TokenResponse{}, err
	}

	if err := q.UpdateUserPasswordAndSessionVersion(ctx, repo.UpdateUserPasswordAndSessionVersionParams{
		ID:           userID,
		PasswordHash: hash,
	}); err != nil {
		return TokenResponse{}, err
	}

	// Re-read the user for the new session version the token must carry.
	u, err = q.FindUserById(ctx, userID)
	if err != nil {
		return TokenResponse{}, err
	}

	token, err := generateToken(s.jwtSecret, u)
	if err != nil {
		return TokenResponse{}, err
	}

	return TokenResponse{Token: token}, nil
}

func toUserResponse(u repo.User) UserResponse {
	return UserResponse{
		ID:        strconv.FormatInt(u.ID, 10),
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
	}
}

// GetAccount handles GET /account.
func (h *Handler) GetAccount(w http.ResponseWriter, r *http.Request) {

	userID, ok := currentUserID(w, r)
	if !ok {
		return
	}

	res, err := h.service.Account(r.Context(), userID)
	if err != nil {
		writeAccountError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "", res)
}

// UpdateAccount handles PUT /account.
func (h *Handler) UpdateAccount(w http.ResponseWriter, r *http.Request) {

	userID, ok := currentUserID(w, r)
	if !ok {
		return
	}

	var req ProfileRequest
	if !decodeAndValidate(w, r, &req) {
		return
	}

	res, err := h.service.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		writeAccountError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "account updated", res)
}

// ChangePassword handles PUT /account/password.
func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {

	userID, ok := currentUserID(w, r)
	if !ok {
		return
	}

	var req PasswordChangeRequest
	if !decodeAndValidate(w, r, &req) {
		return
	}

	res, err := h.service.ChangePassword(r.Context(), userID, req)
	if err != nil {
		writeAccountError(w, err)

		return
	}

	response.JSON(w, http.StatusOK, "password changed", res)
}

// currentUserID reads the signed-in user's id from the request context
// (set by the authenticate middleware), writing a 401 if it's missing.
func currentUserID(w http.ResponseWriter, r *http.Request) (int64, bool) {

	user, ok := reqctx.AuthUserFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, apperr.CodeMissingToken, "missing bearer token")

		return 0, false
	}

	id, err := strconv.ParseInt(user.ID, 10, 64)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, apperr.CodeInvalidToken, "invalid token subject")

		return 0, false
	}

	return id, true
}

// decodeAndValidate decodes the JSON body into req and validates it,
// writing a 400 response and returning false if it is unusable.
func decodeAndValidate[T interface{ Validate() error }](w http.ResponseWriter, r *http.Request, req *T) bool {

	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		response.Error(w, http.StatusBadRequest, apperr.CodeInvalidRequestBody, "invalid request body")

		return false
	}

	if err := (*req).Validate(); err != nil {
		response.AppError(w, http.StatusBadRequest, err)

		return false
	}

	return true
}

func writeAccountError(w http.ResponseWriter, err error) {

	switch {
	case errors.Is(err, ErrEmailTaken):
		response.AppError(w, http.StatusConflict, err)
	case errors.Is(err, ErrWrongCurrentPassword):
		response.AppError(w, http.StatusBadRequest, err)
	case errors.Is(err, pgx.ErrNoRows):
		// The token is valid but its user is gone.
		response.Error(w, http.StatusUnauthorized, apperr.CodeInvalidToken, "user no longer exists")
	default:
		response.Error(w, http.StatusInternalServerError, apperr.CodeInternal, "internal server error")
	}
}
