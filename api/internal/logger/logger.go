// Package logger builds the application's single slog.Logger instance,
// constructed once at startup and passed down to whatever needs it.
package logger

import (
	"log/slog"
	"os"
)

// New builds a structured logger. In debug mode it writes human-readable
// text at DEBUG level; otherwise it writes JSON at INFO level.
func New(debug bool) *slog.Logger {
	opts := &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}

	if debug {
		opts.Level = slog.LevelDebug
		return slog.New(slog.NewTextHandler(os.Stdout, opts))
	}

	return slog.New(slog.NewJSONHandler(os.Stdout, opts))
}
