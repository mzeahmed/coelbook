package auth

import (
	"testing"

	repo "github.com/mzeahmed/coelbook/internal/database/queries"
)

func TestPasswordResetTokenHashesDeterministically(t *testing.T) {
	raw, hash, err := newPasswordResetToken()
	if err != nil {
		t.Fatalf("newPasswordResetToken() error = %v", err)
	}
	if raw == "" || hash == "" {
		t.Fatal("newPasswordResetToken() returned an empty token or hash")
	}
	if got := hashPasswordResetToken(raw); got != hash {
		t.Fatalf("hashPasswordResetToken() = %q, want %q", got, hash)
	}
}

func TestTokenSessionVersionIsPreserved(t *testing.T) {
	user := repo.User{ID: 42, SessionVersion: 3}
	token, err := generateToken("test-secret", user)
	if err != nil {
		t.Fatalf("generateToken() error = %v", err)
	}

	claims, err := ParseToken("test-secret", token)
	if err != nil {
		t.Fatalf("ParseToken() error = %v", err)
	}
	if claims.Subject != "42" {
		t.Fatalf("subject = %q, want 42", claims.Subject)
	}
	if claims.SessionVersion != 3 {
		t.Fatalf("session version = %d, want 3", claims.SessionVersion)
	}
}
