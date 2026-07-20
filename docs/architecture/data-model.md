# Data Model

## Overview

Playbook is a knowledge management application designed to capitalize on technical experience.

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
| id | UUID | Primary key |
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
| id | UUID | Primary key |
| title | String | Short title |
| slug | String | URL identifier |
| summary | Text | Short overview |
| problem | Text | Symptoms and observed behavior |
| diagnosis | Text | Investigation and reasoning |
| root_cause | Text | Root cause |
| solution | Text | Resolution steps |
| prevention | Text | How to avoid recurrence |
| status | Enum | draft / published / archived |
| category_id | UUID | Category |
| created_by | UUID | Author |
| created_at | Timestamp | Creation date |
| updated_at | Timestamp | Last update |

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
| id | UUID |
| name | String |
| slug | String |
| description | Text |

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
| id | UUID |
| name | String |
| slug | String |

---

# IncidentTag

Many-to-many relationship.

| Field | Type |
|--------|------|
| incident_id | UUID |
| tag_id | UUID |

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
| id | UUID |
| incident_id | UUID |
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
| id | UUID |
| incident_id | UUID |
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
| id | UUID |
| incident_id | UUID |
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