# Roadmap

This roadmap describes the planned evolution of Coelbook, grouped by **theme**.

It is intended as a guideline rather than a strict commitment. Priorities may change as the project evolves.

Themes are not versions: work is picked across themes by priority, and a version number is chosen when a coherent set of changes is tagged (see [versioning.md](../releases/versioning.md)). What each released version contains is in the [CHANGELOG](../../CHANGELOG.md).

The vocabulary follows the [domain model](domain.md): the central entity is the **Incident**, classified by **Categories** and **Tags**, and enriched with **Snippets**, **Attachments** and **Links**.

Items marked *(partial)* are started but not complete; the note says what is missing.

---

## Next

The items most likely to be worked on next, in order. Each one is also listed under its theme below.

1. Table of contents on incident pages — *Authoring*
2. Quick search (command palette) — *Search & discovery*
3. Production deployment: Docker image and compose file — *Production & releases*
4. Tag management — *Organization*
5. Incident history — *Authoring*

To decide: whether incidents can be **deleted**, or whether archiving remains the only way to retire one until roles exist (see *Authoring*).

---

## Foundation

- [x] Project structure: Go API, React frontend, PostgreSQL
- [x] Database schema (users, categories, tags, incidents, snippets, attachments, links)
- [x] Installation wizard
- [x] Authentication and password reset
- [x] French user interface (docs and code stay in English)
- [x] Stable API error codes, translated by the frontend
- [x] Field-level validation feedback in forms
- [x] Dashboard (key figures, recent activity, categories and tags)
- [x] Documentation (README, user guide, development guide, in-app help)

---

## Authoring

Writing and reading incidents.

- [x] Create, edit and read incidents
- [x] Structured sections (problem, diagnosis, root cause, solution, prevention)
- [x] Lifecycle: draft → published → archived
- [x] Markdown editor (write / preview, GitHub flavor)
- [x] Code snippets, with syntax highlighting and copy button
- [x] External links
- [ ] Delete incidents *(to decide: archiving may stay the only way to retire an incident, with deletion reserved to admins once roles exist)*
- [ ] Table of contents
- [ ] Incident history (versions and diff)
- [ ] Image uploads
- [ ] File attachments *(partial: `attachments` table exists; no upload or storage)*

---

## Search & discovery

Finding a past solution.

- [x] Full-text search (accent-insensitive, ranked, highlighted, web search syntax)
- [x] Filters by category, status and tag, kept in the URL
- [ ] Quick search (command palette)
- [ ] Related incidents

---

## Organization

Classifying the knowledge base.

- [x] Category management (default categories created at setup)
- [x] Category and tag endpoints for filter facets
- [ ] Tag management *(partial: tags are created from the incident form, with suggestions; no rename, merge or delete)*

---

## Collaboration

Working on the knowledge base as a team.

- [ ] User management
- [ ] Roles & permissions
- [ ] Teams and shared incidents
- [ ] Activity log

---

## Production & releases

Running Coelbook outside the development environment, and shipping versions others can install. Releases become meaningful once this theme is done.

- [ ] Production Docker image (API + built frontend)
- [ ] Production compose file (no dev tools, HTTPS-ready reverse proxy)
- [ ] Migrations applied automatically on startup
- [ ] Release automation: a tag builds and publishes the image, the release notes come from the CHANGELOG
- [ ] Upgrade notes between versions
- [ ] Backup and restore guide

---

## Quality

- [x] CI: Go formatting, vet, tests and build
- [ ] Frontend checks in CI (lint, type-check, build)
- [ ] API integration tests against a real database
- [ ] End-to-end tests of the main user flows

---

## AI assistant

Longer term.

- [ ] Analyze a log and find an existing resolution
- [ ] Suggest tags and categories
- [ ] Draft a write-up from notes
- [ ] Semantic search
