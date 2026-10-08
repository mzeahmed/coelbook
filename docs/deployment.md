# Deployment

How to run Coelbook on a server. For the development environment, see the [README](../README.md#getting-started-development).

A production instance is two containers, defined in [`docker-compose.prod.yml`](../docker-compose.prod.yml):

- **db** — PostgreSQL 17, data in the `db-data` volume;
- **app** — Coelbook: a single binary serving the web interface and the API (under `/api`), built from the [`Dockerfile`](../Dockerfile). It applies pending database migrations on every start.

The app listens on `127.0.0.1` only: a reverse proxy in front of it provides HTTPS.

---

# Requirements

- A Linux server with Docker and the Docker Compose plugin
- A domain name pointing at the server
- A reverse proxy for HTTPS (an example with Caddy is below)
- Optionally, an SMTP account to send password reset emails

---

# Installation

1. Get the code:

   ```bash
   git clone https://github.com/mzeahmed/coelbook.git
   cd coelbook
   ```

2. Create the configuration:

   ```bash
   cp .env.prod.example .env.prod
   ```

   Edit `.env.prod`:

   | Variable | Required | Description |
   | --- | --- | --- |
   | `APP_BASE_URL` | yes | Public URL of the instance, e.g. `https://coelbook.example.com` (used in password reset emails) |
   | `JWT_SECRET` | yes | Signs session tokens — `openssl rand -hex 32` |
   | `POSTGRES_PASSWORD` | yes | Database password — `openssl rand -hex 24` |
   | `POSTGRES_DB`, `POSTGRES_USER` | no | Default `coelbook` |
   | `COELBOOK_PORT` | no | Port on `127.0.0.1` the proxy forwards to, default `8080` |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_TLS` | no | Outgoing email. Leave `SMTP_HOST` empty to run without email: password reset requests are then only logged |

   Keep `.env.prod` private: it holds the secrets.

3. Build and start:

   ```bash
   make prod-up
   ```

   (`docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build`)

4. Check it is running:

   ```bash
   make prod-logs                       # migrations, then "starting coelbook server"
   curl -s http://127.0.0.1:8080/health # {"code":200,...}
   ```

5. Put the reverse proxy in front (below), open the public URL and follow the setup wizard to create the administrator account. Default categories and tags are already there.

---

# HTTPS with a reverse proxy

Any reverse proxy works (Caddy, Traefik, nginx…): forward everything to `127.0.0.1:8080`. No path rewriting is needed — the app serves both the interface and `/api`.

With [Caddy](https://caddyserver.com/), which gets and renews Let's Encrypt certificates on its own, the whole configuration is:

```caddyfile
coelbook.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

---

# Updating

```bash
git pull
make prod-up
```

The image is rebuilt and the app restarted; new database migrations are applied on startup. Read the [CHANGELOG](../CHANGELOG.md) first for anything that needs attention. Back up the database before updating (below).

---

# Backup and restore

All the data is in PostgreSQL. Back it up with `pg_dump`:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T db \
  pg_dump -U coelbook -Fc coelbook > coelbook-$(date +%F).dump
```

Run it daily (e.g. from cron) and keep copies off the server.

To restore into a running instance (this replaces the current data):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T db \
  pg_restore -U coelbook -d coelbook --clean --if-exists < coelbook-2026-10-08.dump
docker compose -f docker-compose.prod.yml --env-file .env.prod restart app
```

---

# Configuration reference

The app reads its configuration from the environment only. Besides the variables above, the image sets:

| Variable | Value in the image | Description |
| --- | --- | --- |
| `APP_ENV` | `production` | Refuses to start with the default `JWT_SECRET` |
| `APP_PORT` | `8080` | Listening port inside the container |
| `STATIC_DIR` | `/web` | Built frontend served by the app |
| `AUTO_MIGRATE` | `true` | Apply pending migrations on startup; set to `false` to run them yourself |

The container runs as a non-root user, on a minimal image with no shell. Its health is checked with `coelbook healthcheck`, which calls `/health`.
