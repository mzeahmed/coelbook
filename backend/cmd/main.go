package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/mzeahmed/playbook/internal/config"
	"github.com/mzeahmed/playbook/internal/database"
	"github.com/mzeahmed/playbook/internal/logger"
	"github.com/mzeahmed/playbook/internal/middleware"
	"github.com/mzeahmed/playbook/internal/router"
	"github.com/mzeahmed/playbook/internal/server"
)

func main() {
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

	handler := router.New(pool, cfg.Auth.JwtSecret, log)
	handler = middleware.LoggingWith(log)(middleware.RecoveryWith(log)(handler))

	log.Info("starting playbook server",
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
