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
- [x] French user interface (docs and code stay in English)
- [x] Stable API error codes, translated by the frontend
- [x] Dashboard (overview with key figures, recent activity, categories and tags)
- [x] Incident detail view
- [ ] Basic documentation pages

---

## v0.2.0 — Knowledge Base

- [ ] Create, edit and delete incidents *(partial: create and edit done; delete missing)*
- [x] Field-level validation feedback in forms
- [x] Structured incident sections (problem, diagnosis, root cause, solution, prevention)
- [x] Incident lifecycle: draft → published → archived
- [x] Category management (default categories created at setup)
- [x] Markdown editor (write / preview, GitHub flavor)
- [ ] Table of contents
- [ ] Incident history

---

## v0.3.0 — Search

- [x] Full-text search
- [x] Filters (category, status, tag)
- [ ] Tags *(partial: assigned from the incident form with suggestions, created on the fly; no rename/merge/delete)*
- [x] Dedicated category and tag endpoints for filter facets
- [ ] Quick search (Command Palette)

---

## v0.4.0 — Snippets & Attachments

- [x] Code snippets
- [x] Syntax highlighting
- [x] Copy code blocks
- [ ] Image uploads
- [ ] File attachments *(partial: `attachments` table exists; no upload or storage)*
- [x] External links

---

## v0.5.0 — Collaboration

- [ ] User management
- [ ] Roles & permissions
- [ ] Teams and shared incidents
- [ ] Activity log

---
