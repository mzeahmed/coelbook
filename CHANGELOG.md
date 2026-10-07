# Changelog

All notable changes to Coelbook are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) — see [docs/releases/versioning.md](docs/releases/versioning.md).

## [Unreleased]

## [0.1.0] - 2026-10-07

First usable version.

### Added

- **Installation** — setup wizard creating the administrator account, the instance settings and a default set of categories.
- **Authentication** — sign-in with JWT, "remember me", and password reset by email.
- **Incidents** ("coelbooks") — create, edit and read incidents with a title, summary, category, tags, status (draft / published / archived) and five sections: problem, diagnosis, root cause, solution, prevention.
- **Markdown** in incident sections (GitHub flavor), with a write / preview editor; raw HTML is ignored and only http(s) and mailto links are kept.
- **Snippets** — reusable commands and code, with syntax highlighting and a copy button; fenced code blocks in sections get the same treatment.
- **External links** on incidents.
- **Search** — full-text search over every field, tags and snippets, accent-insensitive, ranked by relevance, with highlighted matches and web search syntax (`"phrase"`, `-exclude`, `or`).
- **Filters** by category, status and tag, combinable with search and kept in the URL.
- **Categories** — create, rename, describe and delete (when unused).
- **Dashboard** — key figures, recently updated incidents, weekly activity, incidents per category and most used tags.
- **In-app help** page (search syntax, Markdown, statuses).
- **REST API** documented with OpenAPI, with stable error codes and field-level validation errors.
- **French user interface**.
- **Development environment** with Docker Compose (PostgreSQL, API with hot reload, Vite, nginx, Adminer, Mailpit) and a Makefile.
- **CI** running Go formatting, vet, tests and build; `main` is merged back into `develop` after each merged pull request.
- **Documentation** — README, user guide, development guide, domain and data model.

[Unreleased]: https://github.com/mzeahmed/coelbook/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mzeahmed/coelbook/releases/tag/v0.1.0
