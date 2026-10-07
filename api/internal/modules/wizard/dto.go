package wizard

import (
	"strings"

	"github.com/mzeahmed/coelbook/internal/apperr"
)

// AdminRequest is the administrator account submitted at setup time.
type AdminRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

// InstanceRequest is the instance configuration submitted at setup time.
type InstanceRequest struct {
	Name     string `json:"name"`
	Timezone string `json:"timezone"`
	Locale   string `json:"locale"`
}

// SetupRequest is the expected JSON body of a setup request.
type SetupRequest struct {
	Admin    AdminRequest    `json:"admin"`
	Instance InstanceRequest `json:"instance"`
}

// Validate checks that the setup request contains usable data.
func (r SetupRequest) Validate() error {

	if strings.TrimSpace(r.Admin.FirstName) == "" || strings.TrimSpace(r.Admin.LastName) == "" {
		return apperr.New("admin_name_required", "admin name is required")
	}

	if strings.TrimSpace(r.Admin.Email) == "" {
		return apperr.New("admin_email_required", "admin email is required")
	}

	if len(r.Admin.Password) < 8 {
		return apperr.New("admin_password_too_short", "admin password must be at least 8 characters")
	}

	if strings.TrimSpace(r.Instance.Name) == "" {
		return apperr.New("instance_name_required", "instance name is required")
	}

	if strings.TrimSpace(r.Instance.Timezone) == "" {
		return apperr.New("instance_timezone_required", "instance timezone is required")
	}

	if strings.TrimSpace(r.Instance.Locale) == "" {
		return apperr.New("instance_locale_required", "instance locale is required")
	}

	return nil
}

// StatusResponse reports whether the setup wizard has already been
// completed.
type StatusResponse struct {
	Initialized bool `json:"initialized"`
}
