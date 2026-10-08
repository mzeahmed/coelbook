// Package config loads and validates the application configuration.
//
// Configuration is read entirely from environment variables, following the
// Twelve-Factor App convention: a Docker deployment needs nothing more than
// a docker-compose.yml with an `environment:` block, no config file to
// mount. During local development, variables are read from the repo root's
// .env file if present.
package config

import (
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strconv"

	"github.com/joho/godotenv"
)

// Config is the strongly typed application configuration.
type Config struct {
	Env   string
	Debug bool

	Server   ServerConfig
	Database DatabaseConfig
	// AutoMigrate applies pending database migrations on startup.
	AutoMigrate bool
	// StaticDir, when set, is the built frontend the server also serves
	// (see internal/web); empty in development, where Vite serves it.
	StaticDir string
	Auth      AuthConfig
	Mail      MailConfig
}

// ServerConfig configures the HTTP server.
type ServerConfig struct {
	Host string
	Port string
}

// Addr returns the host:port pair the HTTP server should listen on.
func (s ServerConfig) Addr() string {
	return fmt.Sprintf("%s:%s", s.Host, s.Port)
}

// DatabaseConfig configures the PostgreSQL connection.
type DatabaseConfig struct {
	Host     string
	Port     string
	Name     string
	User     string
	Password string

	// DSN is the full connection string. If DATABASE_URL is provided, it is
	// used as-is; otherwise it is built from the fields above.
	DSN string
}

// AuthConfig configures JWT-based authentication.
type AuthConfig struct {
	JwtSecret string
}

// MailConfig configures SMTP delivery and public links embedded in emails.
type MailConfig struct {
	AppBaseURL string
	Host       string
	Port       string
	Username   string
	Password   string
	From       string
	TLS        bool
}

// Load builds the Config from environment variables, falling back to
// sensible development defaults for anything that isn't set.
//
// Outside production, the repo root's .env file is loaded if it exists.
func Load() (*Config, error) {
	// In production the environment is the only source (e.g. a compose
	// env_file): there is no repo checkout to find a .env in.
	if os.Getenv("APP_ENV") != "production" {
		if err := godotenv.Load(envPath()); err != nil {
			log.Println(".env file not found, using system environment variables")
		}
	}

	env := envString("APP_ENV", "development")

	db := DatabaseConfig{
		Host:     envString("DB_HOST", "localhost"),
		Port:     envString("DB_PORT", "5432"),
		Name:     envString("DB_NAME", "coelbook"),
		User:     envString("DB_USER", "coelbook"),
		Password: envString("DB_PASSWORD", "coelbook"),
	}

	// If DATABASE_URL is provided, use it as-is. Otherwise, build the DSN
	// from the individual DB_* variables.
	db.DSN = envString("DATABASE_URL", fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		db.User, db.Password, db.Host, db.Port, db.Name,
	))

	cfg := &Config{
		Env:   env,
		Debug: env != "production",
		Server: ServerConfig{
			Host: envString("APP_HOST", "0.0.0.0"),
			Port: envString("APP_PORT", "8080"),
		},
		Database:    db,
		AutoMigrate: envBool("AUTO_MIGRATE", true),
		StaticDir:   envString("STATIC_DIR", ""),
		Auth: AuthConfig{
			JwtSecret: envString("JWT_SECRET", "change-me"),
		},
		Mail: MailConfig{
			AppBaseURL: envString("APP_BASE_URL", "http://coelbook.local"),
			Host:       envString("SMTP_HOST", "localhost"),
			Port:       envString("SMTP_PORT", "1025"),
			Username:   envString("SMTP_USERNAME", ""),
			Password:   envString("SMTP_PASSWORD", ""),
			From:       envString("SMTP_FROM", "noreply@coelbook.local"),
			TLS:        envBool("SMTP_TLS", false),
		},
	}

	if cfg.Env == "production" && cfg.Auth.JwtSecret == "change-me" {
		return nil, errors.New("JWT_SECRET must be set to a non-default value in production")
	}

	return cfg, nil
}

// envPath returns the absolute path to the repo root's .env file, resolved
// relative to this source file rather than the process's working
// directory. This ensures the correct file is loaded regardless of where
// the binary is run from (go run, air, or a Docker container).
func envPath() string {
	_, thisFile, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(thisFile), "..", "..", "..", ".env")
}

// envString returns the environment variable's value, or def if unset.
func envString(key, def string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}

	return def
}

// envBool returns the boolean environment value, falling back to def when it
// is unset or cannot be parsed.
func envBool(key string, def bool) bool {
	v, ok := os.LookupEnv(key)
	if !ok {
		return def
	}

	parsed, err := strconv.ParseBool(v)
	if err != nil {
		return def
	}

	return parsed
}
