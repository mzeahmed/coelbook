package mailer

import (
	"io"
	"mime"
	"mime/quotedprintable"
	"net/mail"
	"strings"
	"testing"
)

func TestPasswordResetMessageIsFrenchAndDecodable(t *testing.T) {
	link := "https://coelbook.example.com/reset-password?token=abc%2B123"

	raw, err := passwordResetMessage("noreply@example.com", "ada@example.com", link)
	if err != nil {
		t.Fatal(err)
	}

	msg, err := mail.ReadMessage(strings.NewReader(raw))
	if err != nil {
		t.Fatalf("not a valid message: %v", err)
	}

	// The raw subject header is ASCII; decoded, it's the French text.
	if strings.ContainsAny(msg.Header.Get("Subject"), "éè") {
		t.Errorf("subject header is not encoded: %q", msg.Header.Get("Subject"))
	}
	subject, err := new(mime.WordDecoder).DecodeHeader(msg.Header.Get("Subject"))
	if err != nil || subject != "Réinitialisez votre mot de passe Coelbook" {
		t.Errorf("subject = %q (%v)", subject, err)
	}

	body, err := io.ReadAll(msg.Body)
	if err != nil {
		t.Fatal(err)
	}
	text := decodeQP(t, string(body))

	for _, want := range []string{"réinitialisation du mot de passe", link, "expire dans une heure"} {
		if !strings.Contains(text, want) {
			t.Errorf("body misses %q:\n%s", want, text)
		}
	}
}

func decodeQP(t *testing.T, s string) string {
	t.Helper()

	out, err := io.ReadAll(newQPReader(s))
	if err != nil {
		t.Fatal(err)
	}

	return string(out)
}

func newQPReader(s string) io.Reader {
	return quotedprintable.NewReader(strings.NewReader(s))
}
