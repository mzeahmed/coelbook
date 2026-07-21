package wizard

import (
	"errors"
	"strings"
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
		return errors.New("admin name is required")
	}

	if strings.TrimSpace(r.Admin.Email) == "" {
		return errors.New("admin email is required")
	}

	if len(r.Admin.Password) < 8 {
		return errors.New("admin password must be at least 8 characters")
	}

	if strings.TrimSpace(r.Instance.Name) == "" {
		return errors.New("instance name is required")
	}

	if strings.TrimSpace(r.Instance.Timezone) == "" {
		return errors.New("instance timezone is required")
	}

	if strings.TrimSpace(r.Instance.Locale) == "" {
		return errors.New("instance locale is required")
	}

	return nil
}

// StatusResponse reports whether the setup wizard has already been
// completed.
type StatusResponse struct {
	Initialized bool `json:"initialized"`
}