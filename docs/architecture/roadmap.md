# Roadmap

This roadmap describes the planned evolution of Coelbook.

It is intended as a guideline rather than a strict commitment. Priorities may change as the project evolves.

The vocabulary follows the [domain model](domain.md): the central entity is the **Incident**, classified by **Categories** and **Tags**, and enriched with **Snippets**, **Attachments** and **Links**.

Items marked *(partial)* are started but not complete; the note says what is missing.

---

## v0.1.0 — Foundation

- [x] Initial project structure
- [x] React frontend
- [x] Go API
- [x] PostgreSQL support
- [x] Database schema (users, categories, tags, incidents, snippets, attachments, links)
- [x] Installation wizard
- [x] Authentication
- [x] Password reset
- [ ] Dashboard *(partial: incident list with filters and pagination exists; no stats or overview yet)*
- [ ] Incident detail view
- [ ] Basic documentation pages

---

## v0.2.0 — Knowledge Base

- [ ] Create, edit and delete incidents *(partial: read-only `GET /incidents` endpoint exists)*
- [ ] Structured incident sections (problem, diagnosis, root cause, solution, prevention)
- [ ] Incident lifecycle: draft → published → archived *(partial: `status` column and filter exist; no transitions)*
- [ ] Category management
- [ ] Markdown editor
- [ ] Table of contents
- [ ] Incident history

---

## v0.3.0 — Search

- [ ] Full-text search *(partial: `ILIKE` match on title and summary only)*
- [ ] Filters *(partial: category, status and tag filters on the incident list)*
- [ ] Tags *(partial: schema and filter exist; no tag management)*
- [ ] Dedicated category and tag endpoints for filter facets
- [ ] Quick search (Command Palette)

---

## v0.4.0 — Snippets & Attachments

- [ ] Code snippets *(partial: `snippets` table exists; no API or UI)*
- [ ] Syntax highlighting
- [ ] Copy code blocks
- [ ] Image uploads
- [ ] File attachments *(partial: `attachments` table exists; no upload or storage)*
- [ ] External links *(partial: `links` table exists; no API or UI)*

---

## v0.5.0 — Collaboration

- [ ] User management
- [ ] Roles & permissions
- [ ] Teams and shared incidents
- [ ] Activity log

---
