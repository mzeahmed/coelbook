# Data Model

## Overview

Coelbook is a knowledge management application designed to capitalize on technical experience.

The application does not merely log incidents. It capitalizes the reusable technical knowledge produced while resolving them.

Each Incident represents a documented solution to a technical problem.

---

# Entity Relationship Diagram

```text
User
 │
 └────────────┐
              │
              ▼
          Incident
         /    |    \
        /     |     \
 Category  Snippet  Attachment
     |
     |
 IncidentTag
     |
     ▼
    Tag

Incident
    │
    ▼
   Link
```

---

# User

Represents an authenticated user of the application.

| Field | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| email | String | Unique email |
| password_hash | String | Hashed password |
| name | String | Display name |
| created_at | Timestamp | Creation date |
| updated_at | Timestamp | Last update |

---

# Incident

The central entity of the application.

An Incident documents a technical problem and its resolution.

| Field | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| title | String | Short title |
| slug | String | URL identifier |
| summary | Text | Short overview |
| problem | Text | Symptoms and observed behavior |
| diagnosis | Text | Investigation and reasoning |
| root_cause | Text | Root cause |
| solution | Text | Resolution steps |
| prevention | Text | How to avoid recurrence |
| status | Enum | draft / published / archived |
| category_id | BIGINT | Category |
| created_by | BIGINT | Author |
| created_at | Timestamp | Creation date |
| updated_at | Timestamp | Last update |
| search_vector | tsvector | Weighted full-text document (GIN-indexed) |

`search_vector` is built by the SQL function `incident_search_vector(id)` with the `coelbook` text search configuration (`simple` dictionary + `unaccent`: accent-insensitive, no stemming). Weights: **A** title; **B** summary, problem, tag names; **C** diagnosis, root cause, solution, snippet titles; **D** prevention. It is not kept up to date by the database: the API refreshes it after every write, so rows edited directly in SQL need `UPDATE incidents SET search_vector = incident_search_vector(id)`.

## Incident versions

Table `incident_versions` keeps the history of each incident: one row per version, with a full `snapshot` (JSON: title, summary, the five sections, status, category, tag names, snippets and links), the `changed_fields` compared with the previous version, the `author_id` (set to NULL if the user is deleted) and the `created_at` date.

The snapshot is built by the SQL function `incident_snapshot(id)`, its single definition. The API records a version at the end of every incident write transaction (query `RecordIncidentVersion`) and skips it when the snapshot equals the previous one. Every version is kept. Incidents that existed before the table were given a version 1 with their state at the time.

---

# Category

Groups Incidents by technical domain.

Examples:

- Docker
- Linux
- Git
- Go
- PostgreSQL
- Networking

| Field | Type |
|--------|------|
| id | BIGINT |
| name | String |
| slug | String |
| description | Text |

Names are unique case-insensitively; the slug is derived from the name at creation and never changes. A category can only be deleted once no incident uses it (enforced by the `incidents.category_id` foreign key).

A default set is created by migration `00012_default_categories_and_tags.sql`, so an instance can file its first incident right away: Base de données, CI/CD, Cloud, Développement, Docker, Réseau, Sécurité, Système (French, like the UI). Being a migration, it runs once on every instance, new or existing, and skips names or slugs that already exist. They can be renamed or deleted like any other category.

---

# Tag

Provides flexible classification.

Examples:

- ssh
- permissions
- docker
- github
- ssl
- nginx

| Field | Type |
|--------|------|
| id | BIGINT |
| name | String |
| slug | String |


The same migration (`00012`) creates default tags — common technical terms such as docker, kubernetes, linux, git, nginx, postgresql, ssh, ssl — that the incident form suggests before any incident uses them. Tags are identified by their slug, derived from the name; renaming a tag changes its slug.
---

# IncidentTag

Many-to-many relationship.

| Field | Type |
|--------|------|
| incident_id | BIGINT |
| tag_id | BIGINT |

---

# Attachment

Stores files related to an Incident.

Examples:

- screenshots
- PDF
- log files
- archives

| Field | Type |
|--------|------|
| id | BIGINT |
| incident_id | BIGINT |
| filename | String |
| mime | String |
| size | Integer |
| path | String |
| created_at | Timestamp |

---

# Snippet

Stores reusable code or command snippets.

Examples:

- Shell commands
- SQL queries
- Docker Compose
- YAML
- Go code

| Field | Type |
|--------|------|
| id | BIGINT |
| incident_id | BIGINT |
| title | String |
| language | String |
| content | Text |
| order | Integer |

---

# Link

References external resources.

Examples:

- GitHub Issue
- Official Documentation
- RFC
- Stack Overflow

| Field | Type |
|--------|------|
| id | BIGINT |
| incident_id | BIGINT |
| title | String |
| url | String |

---

# Incident Lifecycle

```text
Draft
   │
   ▼
Published
   │
   ▼
Archived
```

## Draft

The Incident is being written.

## Published

The Incident is available for search and reuse.

## Archived

The Incident is obsolete but kept for historical reference.

---

# Design Principles

- API-first architecture
- Knowledge-centric model
- Simple relational database
- Extensible without schema redesign
- One Incident may contain multiple snippets, attachments and external references

---

# Out of Scope (V1)

The following features are intentionally excluded from the initial version:

- Comments
- Version history
- Team management
- Fine-grained permissions
- AI-generated content
- Relationships between Incidents
- Full-text semantic search

These features may be introduced in future releases without requiring major changes to the data model.