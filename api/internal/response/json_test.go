package response

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

func decode(t *testing.T, rec *httptest.ResponseRecorder) Envelope {
	t.Helper()

	var env Envelope
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("decode envelope: %v", err)
	}

	return env
}

func TestAppErrorUsesWrappedCode(t *testing.T) {
	rec := httptest.NewRecorder()
	err := fmt.Errorf("validate: %w", apperr.New("title_required", "title is required"))

	AppError(rec, http.StatusBadRequest, err)

	env := decode(t, rec)
	if rec.Code != http.StatusBadRequest || env.Error != "title_required" || env.Message != "title is required" || env.Success {
		t.Fatalf("got status %d, envelope %+v", rec.Code, env)
	}
}

func TestAppErrorIncludesField(t *testing.T) {
	rec := httptest.NewRecorder()

	AppError(rec, http.StatusBadRequest, apperr.NewField("invalid_link_url", "links[1].url", "bad url"))

	env := decode(t, rec)
	if env.Error != "invalid_link_url" || env.Field != "links[1].url" {
		t.Fatalf("got envelope %+v", env)
	}
}

func TestAppErrorHidesUnknownErrors(t *testing.T) {
	rec := httptest.NewRecorder()

	AppError(rec, http.StatusBadRequest, errors.New("pq: connection refused"))

	env := decode(t, rec)
	if rec.Code != http.StatusInternalServerError || env.Error != apperr.CodeInternal || env.Message != "internal server error" {
		t.Fatalf("got status %d, envelope %+v", rec.Code, env)
	}
}

func TestJSONOmitsErrorCodeOnSuccess(t *testing.T) {
	rec := httptest.NewRecorder()

	JSON(rec, http.StatusOK, "", nil)

	var raw map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&raw); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if _, ok := raw["error"]; ok {
		t.Fatalf("success envelope has an error field: %v", raw)
	}
}
