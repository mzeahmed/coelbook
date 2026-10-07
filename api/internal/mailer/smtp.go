// Package mailer delivers transactional emails through SMTP.
package mailer

import (
	"context"
	"crypto/tls"
	"fmt"
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

	resetURL, err := url.Parse(s.config.AppBaseURL)
	if err != nil {
		return fmt.Errorf("parse application base URL: %w", err)
	}
	resetURL.Path = strings.TrimRight(resetURL.Path, "/") + "/reset-password"
	query := resetURL.Query()
	query.Set("token", token)
	resetURL.RawQuery = query.Encode()

	body := strings.Join([]string{
		"To: " + recipient,
		"From: " + s.config.From,
		"Subject: Reset your Coelbook password",
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		"A password reset was requested for your Coelbook account.",
		"",
		"Open this link to choose a new password:",
		resetURL.String(),
		"",
		"This link expires in one hour. If you did not request this, you can ignore this email.",
	}, "\r\n")

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
