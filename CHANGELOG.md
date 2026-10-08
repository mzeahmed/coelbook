# Changelog

All notable changes to Coelbook are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) — see [docs/releases/versioning.md](docs/releases/versioning.md).

## [Unreleased]

## [0.2.0] - 2026-10-08

First version installable from a published image.

### Added

- **Production deployment** — a single Docker image serving the interface and the API (non-root, ~28 MB, amd64 and arm64), a production compose file, and a [deployment guide](docs/deployment.md) covering HTTPS, updates, backup and restore. Published to `ghcr.io/mzeahmed/coelbook` for each release.
- **Automatic database migrations** on startup, embedded in the binary — no goose CLI needed to install or update.
- **Incident history** — every change records a version; compare any two versions field by field (removed and added lines, tags), with a shareable link.
- **Table of contents** on incident pages, from the sections and their Markdown headings, with shareable anchors and the current section highlighted.
- **Quick search** (Ctrl/⌘K) from any page: incidents and pages, keyboard navigation.
- **Tag management** — rename, merge duplicates, delete, clean up unused tags; search is reindexed accordingly.
- **Settings page** — profile, password change (other sessions are signed out), instance name, time zone and language.
- **Default categories and tags** on every instance, new or existing; the incident form suggests tags as you type.
- **Screenshots** in the README.

### Changed

- The sidebar stays in view on long pages, and a slide-in menu replaces it on mobile.
- The incident list filters by tag with a dropdown instead of one button per tag.
- Default categories come from a migration instead of the setup wizard.
- The password reset email is in French.
- The roadmap is organized by theme; release numbers are chosen when tagging.

### Fixed

- Sign-in and password reset compare email addresses case-insensitively; two accounts can no longer differ only by the case of their email.
- Long lines (code, URLs) no longer widen pages on small screens.
- A missing script or style file returns 404 instead of the application page.
- Password reset requests without email configured are logged clearly instead of failing on a connection error.

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

[Unreleased]: https://github.com/mzeahmed/coelbook/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/mzeahmed/coelbook/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mzeahmed/coelbook/releases/tag/v0.1.0
