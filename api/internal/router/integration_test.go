package router_test

import (
	"net/http"
	"testing"

	"github.com/mzeahmed/coelbook/internal/testutil"
)

// The wiring itself: a fresh database, the real migrations, the real
// router. It also guards the test infrastructure against regressions.
func TestInstallationAndSignIn(t *testing.T) {
	app := testutil.NewApp(t)

	var status struct {
		Initialized bool `json:"initialized"`
	}

	res := app.Do(t, http.MethodGet, "/setup/status", "", nil)
	res.Decode(t, &status)
	if res.Status != http.StatusOK || status.Initialized {
		t.Fatalf("fresh instance: status %d, initialized %v; want 200, false", res.Status, status.Initialized)
	}

	token := app.Setup(t)

	app.Do(t, http.MethodGet, "/setup/status", "", nil).Decode(t, &status)
	if !status.Initialized {
		t.Error("instance is not initialized after setup")
	}

	if res := app.Do(t, http.MethodGet, "/incidents", "", nil); res.Status != http.StatusUnauthorized {
		t.Errorf("GET /incidents without a token = %d, want 401", res.Status)
	}

	if res := app.Do(t, http.MethodGet, "/incidents", token, nil); res.Status != http.StatusOK {
		t.Errorf("GET /incidents with a token = %d, want 200", res.Status)
	}

	if res := app.Do(t, http.MethodPost, "/setup", "", map[string]any{}); res.Status == http.StatusOK || res.Status == http.StatusCreated {
		t.Errorf("a second setup was accepted (%d)", res.Status)
	}
}

func TestSignInRefusesAWrongPassword(t *testing.T) {
	app := testutil.NewApp(t)
	app.Setup(t)

	res := app.Do(t, http.MethodPost, "/auth/login", "", map[string]string{
		"email":    testutil.AdminEmail,
		"password": "not-the-password",
	})
	if res.Status != http.StatusUnauthorized {
		t.Errorf("login with a wrong password = %d (%s), want 401", res.Status, res.Error)
	}
}
