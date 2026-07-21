// Package server provides a production-ready HTTP server with graceful
// shutdown support.
package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

// Config holds the configuration for the HTTP server.
type Config struct {
	// Addr is the TCP address to listen on, e.g. ":8080".
	Addr string

	// Handler is the http.Handler that handles all incoming requests.
	Handler http.Handler

	// ReadTimeout is the maximum duration for reading the entire
	// request body. Defaults to 15 seconds if zero.
	ReadTimeout time.Duration

	// WriteTimeout is the maximum duration before timing out writes
	// of the response. Defaults to 15 seconds if zero.
	WriteTimeout time.Duration

	// ShutdownTimeout is the maximum duration to wait for the server
	// to shut down gracefully before forcefully closing. Defaults to
	// 30 seconds if zero.
	ShutdownTimeout time.Duration
}

// Run starts the HTTP server and blocks until it receives an interrupt or
// SIGTERM signal, at which point it shuts down gracefully.
//
// It returns an error if the server fails to start or if the graceful
// shutdown times out.
func Run(cfg Config) error {

	srv := &http.Server{
		Addr:         cfg.Addr,
		Handler:      cfg.Handler,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}

	if srv.ReadTimeout == 0 {
		srv.ReadTimeout = 15 * time.Second
	}

	if srv.WriteTimeout == 0 {
		srv.WriteTimeout = 15 * time.Second
	}

	shutdownTimeout := cfg.ShutdownTimeout
	if shutdownTimeout == 0 {
		shutdownTimeout = 30 * time.Second
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)

	go func() {
		log.Printf("server listening on %s", cfg.Addr)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		return err

	case <-ctx.Done():
		log.Println("shutting down gracefully...")

		shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			return err
		}

		log.Println("server stopped")
		return nil
	}
}
