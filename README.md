# Playbook

[![Go Version](https://img.shields.io/github/go-mod/go-version/mzeahmed/playbook?filename=backend%2Fgo.mod)](backend/go.mod)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

# Playbook

> Never solve the same problem twice.

Playbook is a technical knowledge capitalization platform that lets you document, find and reuse solutions to the incidents you run into day to day.

Every problem solved becomes knowledge you, your team, or an AI assistant can reuse.

---

# Why?

Every developer spends a significant part of their time solving problems they've already run into before:

- Git error
- Docker configuration
- SSH issue
- CI/CD incident
- Kubernetes error
- Traefik configuration
- PostgreSQL issue

A few months later…

…the same research starts all over again.

Playbook turns every resolution into a lasting resource.

---

# Vision

Playbook is not a wiki.

Playbook is a technical experience capitalization platform.

Every incident follows a lifecycle:

```text
Incident

↓

Investigation

↓

Diagnosis

↓

Resolution

↓

Capitalization

↓

Reuse
```

The goal is simple:

> **Build your technical memory.**

---

# Features

## Incident management

Every incident contains:

- title
- summary
- category
- tags
- symptoms
- diagnosis
- cause
- resolution
- prevention
- commands
- logs
- screenshots
- attachments

---

## Search

Fast search by:

- text
- command
- tag
- category
- symptom
- error message

---

## AI Assistant

The AI assistant will be able to:

- analyze a log
- find an existing resolution
- suggest a new resolution
- automatically generate a write-up

---

## History

Every change is tracked in history.

---

## REST API

The application is entirely driven by a REST API.

The frontend, the CLI and future extensions will all use the same API.

---

# Use cases

Playbook can document incidents related to:

- Git
- GitHub
- Docker
- Kubernetes
- Linux
- SSH
- Go
- Symfony
- PostgreSQL
- WordPress
- Apache
- Nginx
- CI/CD
- GitHub Actions
- OpenAI
- Ollama

---

# Tech stack

## Backend

- Go
- Chi
- PostgreSQL
- sqlc
- goose
- JWT
- OpenAPI

## Frontend

- Vanilla JavaScript
- TypeScript
- Vite
- Bootstrap 5

## Database

- PostgreSQL

## Deployment

- Docker
- Docker Compose

---

# Starting the development environment

## Prerequisites

- Docker
- Docker Compose

## Setup

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

2. Start the environment:

   ```bash
   make up
   ```

   This command:
   - adds `playbook.local` and `api.playbook.local` to `/etc/hosts` (asks for your sudo password)
   - copies `.env.example` to `.env` if it doesn't exist yet
   - builds and starts the containers: PostgreSQL, backend (hot-reload via [air](https://github.com/air-verse/air)), frontend (Vite dev server), nginx, Adminer

## Available services

| Service    | URL                        |
| ---------- | -------------------------- |
| Frontend   | http://playbook.local      |
| API        | http://api.playbook.local  |
| Adminer    | http://localhost:8081      |
| PostgreSQL | localhost:5432             |

## Stopping

```bash
make down
```

Stops the containers and removes `playbook.local`/`api.playbook.local` from `/etc/hosts`.

## Other useful commands

| Command | Description |
| --- | --- |
| `make logs` | Follow the containers' logs |
| `make ps` | List the containers |
| `make bash` | Open a shell in the backend container |
| `make restart` | Restart the environment |
| `make migrate-up` | Apply migrations |
| `make migrate-down` | Roll back the last migration |
| `make sqlc` | Regenerate Go code from SQL queries |

The full list of commands is available via:

```bash
make help
```

---

# Architecture

```text
                Frontend (Vite + TypeScript)

                  │

            REST API

                  │

               Go API

                  │

             PostgreSQL
```

---

# Roadmap

## V1

- Incident management
- Categories
- Tags
- Search
- Authentication

## V2

- AI Assistant

- Semantic search

- Automatic write-up generation

## V3

- CLI

- Browser extension

- Import / Export

- Sync

## V4

- Collaborative work

- Team management

- Permissions

---

# License

MIT