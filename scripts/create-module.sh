#!/usr/bin/env bash
# Scaffolds a new backend module under backend/internal/modules/<name>,
# following the shape used by the existing modules (health, auth, wizard):
# dto.go, handler.go, module.go and service.go, with module.go exposing a
# Module struct, a New constructor and a RegisterRoutes method.
#
# Usage: ./scripts/create-module.sh <name>
set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: ./scripts/create-module.sh <name>" >&2
    exit 1
fi

name="$1"

if [[ ! "$name" =~ ^[a-z][a-z0-9]*$ ]]; then
    echo "Invalid module name '$name': use a single lowercase word (e.g. 'incident'), matching a valid Go package name." >&2
    exit 1
fi

module_dir="backend/internal/modules/$name"

if [ -e "$module_dir" ]; then
    echo "$module_dir already exists." >&2
    exit 1
fi

mkdir -p "$module_dir"

cat > "$module_dir/dto.go" <<'GOEOF'
package __MODULE__

// ExampleResponse is a placeholder response for the __MODULE__ module's
// example route. Replace it with real request/response types as the
// module grows.
type ExampleResponse struct {
	Message string `json:"message"`
}
GOEOF

cat > "$module_dir/service.go" <<'GOEOF'
package __MODULE__

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

// Service contains the business logic of the __MODULE__ module.
type Service struct {
	pool *pgxpool.Pool
}

// NewService creates a new __MODULE__ service.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// Example is a placeholder demonstrating the handler → service call chain.
// Replace it with real business logic as the module grows.
func (s *Service) Example() string {
	return "hello from __MODULE__"
}
GOEOF

cat > "$module_dir/handler.go" <<'GOEOF'
package __MODULE__

import (
	"net/http"

	"github.com/mzeahmed/coelbook/internal/response"
)

// Handler handles all HTTP requests related to the __MODULE__ module.
type Handler struct {
	service *Service
}

// NewHandler creates a new __MODULE__ handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Example handles GET /__MODULE__.
func (h *Handler) Example(w http.ResponseWriter, _ *http.Request) {
	response.JSON(w, http.StatusOK, "__MODULE__ module is working", ExampleResponse{
		Message: h.service.Example(),
	})
}
GOEOF

cat > "$module_dir/module.go" <<'GOEOF'
// Package __MODULE__ exposes the __MODULE__ module's HTTP routes.
//
// Replace this doc comment with a real description as the module takes
// shape.
package __MODULE__

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Module wires together the __MODULE__ module's dependencies and exposes
// its HTTP routes.
type Module struct {
	handler *Handler
}

// New builds the __MODULE__ Module, initializing its handler and service
// dependencies.
func New(pool *pgxpool.Pool) *Module {
	return &Module{
		handler: NewHandler(NewService(pool)),
	}
}

// RegisterRoutes registers the __MODULE__ module's routes on the given mux.
//
// This is a placeholder route demonstrating the wiring; replace it with
// the module's real endpoints.
func (m *Module) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /__MODULE__", m.handler.Example)
}
GOEOF

sed -i "s/__MODULE__/$name/g" "$module_dir"/*.go

echo "Created $module_dir:"
echo "  - dto.go"
echo "  - service.go"
echo "  - handler.go"
echo "  - module.go"

router_file="backend/internal/router/router.go"
import_line="\t\"github.com/mzeahmed/coelbook/internal/modules/$name\""
register_line="\t$name.New(pool).RegisterRoutes(mux)"

if [ ! -f "$router_file" ]; then
    echo ""
    echo "Warning: $router_file not found, skipping wiring." >&2
    echo "Wire it manually: $name.New(pool).RegisterRoutes(mux)"
    exit 0
fi

if command grep -q "internal/modules/$name\"" "$router_file"; then
    echo ""
    echo "$router_file already imports the $name module, leaving it untouched."
    exit 0
fi

# Append the new import right after the last existing modules/* import, and
# the new registration call right after the last existing RegisterRoutes
# call — found by reversing the file, replacing the first match (i.e. the
# last one in normal order), then reversing back.
tac "$router_file" \
    | sed "0,\\#^.*internal/modules/.*\$#s##${import_line}\n&#" \
    | tac > "$router_file.tmp"
mv "$router_file.tmp" "$router_file"

tac "$router_file" \
    | sed "0,\\#^.*\.RegisterRoutes(mux)\$#s##${register_line}\n&#" \
    | tac > "$router_file.tmp"
mv "$router_file.tmp" "$router_file"

gofmt -w "$router_file"

echo "  - wired into $router_file"