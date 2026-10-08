// Package mailer delivers transactional emails through SMTP.
package mailer

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"mime"
	"mime/quotedprintable"
	"net"
	"net/smtp"
	"net/url"
	"strings"
	"time"

	"github.com/mzeahmed/coelbook/internal/config"
)

// Sender delivers password-reset emails.
type Sender interface {
	SendPasswordReset(ctx context.Context, recipient, token string) error
}

// SMTP sends transactional emails using the configured SMTP server.
type SMTP struct {
	config config.MailConfig
}

// NewSMTP builds an SMTP sender from the application mail configuration.
func NewSMTP(cfg config.MailConfig) *SMTP {
	return &SMTP{config: cfg}
}

// SendPasswordReset sends the recipient a link containing the supplied raw
// password-reset token. Tokens are URL-escaped before being included.
func (s *SMTP) SendPasswordReset(ctx context.Context, recipient, token string) error {
	_ = ctx

	// An instance may run without outgoing email; the caller logs this and
	// the user still gets the usual "if the account exists…" answer.
	if s.config.Host == "" {
		return errors.New("email is disabled: SMTP_HOST is not set")
	}

	resetURL, err := url.Parse(s.config.AppBaseURL)
	if err != nil {
		return fmt.Errorf("parse application base URL: %w", err)
	}
	resetURL.Path = strings.TrimRight(resetURL.Path, "/") + "/reset-password"
	query := resetURL.Query()
	query.Set("token", token)
	resetURL.RawQuery = query.Encode()

	body, err := passwordResetMessage(s.config.From, recipient, resetURL.String())
	if err != nil {
		return fmt.Errorf("build password reset email: %w", err)
	}

	address := net.JoinHostPort(s.config.Host, s.config.Port)
	conn, err := net.DialTimeout("tcp", address, 10*time.Second)
	if err != nil {
		return fmt.Errorf("dial SMTP server: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.config.Host)
	if err != nil {
		return fmt.Errorf("create SMTP client: %w", err)
	}
	defer client.Quit()

	if s.config.TLS {
		if err := client.StartTLS(&tls.Config{ServerName: s.config.Host, MinVersion: tls.VersionTLS12}); err != nil {
			return fmt.Errorf("start SMTP TLS: %w", err)
		}
	}

	if s.config.Username != "" {
		auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("authenticate SMTP client: %w", err)
		}
	}

	if err := client.Mail(s.config.From); err != nil {
		return fmt.Errorf("set SMTP sender: %w", err)
	}
	if err := client.Rcpt(recipient); err != nil {
		return fmt.Errorf("set SMTP recipient: %w", err)
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("open SMTP message body: %w", err)
	}
	if _, err := writer.Write([]byte(body)); err != nil {
		return fmt.Errorf("write SMTP message body: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("close SMTP message body: %w", err)
	}

	return nil
}

// passwordResetMessage builds the password reset email, in French like the
// rest of the interface. Headers must be ASCII, so the subject is RFC 2047
// encoded; the body is quoted-printable so its accents survive any relay.
func passwordResetMessage(from, recipient, link string) (string, error) {

	text := strings.Join([]string{
		"Bonjour,",
		"",
		"Une réinitialisation du mot de passe de votre compte Coelbook a été demandée.",
		"",
		"Ouvrez ce lien pour choisir un nouveau mot de passe :",
		link,
		"",
		"Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail : votre mot de passe reste inchangé.",
	}, "\r\n")

	var encoded strings.Builder
	qp := quotedprintable.NewWriter(&encoded)
	if _, err := qp.Write([]byte(text)); err != nil {
		return "", err
	}
	if err := qp.Close(); err != nil {
		return "", err
	}

	return strings.Join([]string{
		"To: " + recipient,
		"From: " + from,
		"Subject: " + mime.QEncoding.Encode("utf-8", "Réinitialisez votre mot de passe Coelbook"),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"Content-Transfer-Encoding: quoted-printable",
		"",
		encoded.String(),
	}, "\r\n"), nil
}
