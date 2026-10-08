package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/mzeahmed/coelbook/internal/config"
	"github.com/mzeahmed/coelbook/internal/database"
	"github.com/mzeahmed/coelbook/internal/logger"
	"github.com/mzeahmed/coelbook/internal/mailer"
	"github.com/mzeahmed/coelbook/internal/middleware"
	"github.com/mzeahmed/coelbook/internal/router"
	"github.com/mzeahmed/coelbook/internal/server"
	"github.com/mzeahmed/coelbook/internal/web"
)

func main() {
	// `coelbook healthcheck` lets the container check itself: the production
	// image has no shell, curl or wget.
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		os.Exit(healthcheck())
	}

	if err := runConfig(); err != nil {
		_, err := fmt.Fprintln(os.Stderr, err)
		if err != nil {
			return
		}
		os.Exit(1)
	}
}

func runConfig() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	log := logger.New(cfg.Debug)

	pool, err := database.Open(context.Background(), cfg.Database.DSN)
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}
	defer pool.Close()

	if cfg.AutoMigrate {
		if err := database.Migrate(context.Background(), pool, log); err != nil {
			return fmt.Errorf("migrate database: %w", err)
		}
	}

	handler := router.New(pool, cfg.Auth.JwtSecret, mailer.NewSMTP(cfg.Mail), log)
	if cfg.StaticDir != "" {
		handler = web.Handler(handler, cfg.StaticDir)
		log.Info("serving the frontend", "dir", cfg.StaticDir)
	}
	handler = middleware.LoggingWith(log)(middleware.RecoveryWith(log)(handler))

	log.Info("starting coelbook server",
		"addr", cfg.Server.Addr(),
	)

	if err := server.Run(server.Config{
		Addr:         cfg.Server.Addr(),
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}); err != nil {
		return fmt.Errorf("start server: %w", err)
	}

	return nil
}

// healthcheck queries the running server's /health endpoint on this
// machine and returns the process exit code: 0 when it answers 200.
func healthcheck() int {

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	client := &http.Client{Timeout: 3 * time.Second}

	resp, err := client.Get("http://127.0.0.1:" + port + "/health")
	if err != nil {
		_, _ = fmt.Fprintln(os.Stderr, "healthcheck:", err)

		return 1
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		_, _ = fmt.Fprintln(os.Stderr, "healthcheck: status", resp.StatusCode)

		return 1
	}

	return 0
}
