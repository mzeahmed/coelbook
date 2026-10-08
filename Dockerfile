# Production image: one process serving the API and the built frontend.
#
#   docker build -t coelbook .
#
# The development environment (docker-compose.yml, .docker/) is separate:
# it runs the API with hot reload and the frontend on the Vite dev server.

# --- Frontend: static build ---------------------------------------------------
FROM node:24-alpine AS frontend

WORKDIR /src/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

# --- API: static binary -------------------------------------------------------
FROM golang:1.26-alpine AS api

WORKDIR /src/api

COPY api/go.mod api/go.sum ./
RUN go mod download

COPY api/ ./
# Static binary (no libc needed at runtime); -trimpath and stripped symbols
# keep it reproducible and small. Migrations and time zone data are
# embedded in it.
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/coelbook ./cmd

# --- Runtime ------------------------------------------------------------------
# distroless/static: CA certificates (for SMTP over TLS) and nothing else —
# no shell, no package manager. The :nonroot tag runs as UID 65532.
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=api /out/coelbook /coelbook
COPY --from=frontend /src/frontend/dist /web

ENV APP_ENV=production \
    APP_HOST=0.0.0.0 \
    APP_PORT=8080 \
    STATIC_DIR=/web \
    AUTO_MIGRATE=true

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["/coelbook", "healthcheck"]

ENTRYPOINT ["/coelbook"]
