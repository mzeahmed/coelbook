# Domain Model

## Overview

Coelbook is a knowledge management application designed for developers and system administrators.

Its purpose is to capture technical knowledge acquired while solving real-world problems, making it searchable and reusable.

The application follows a **knowledge-centric** approach rather than an incident-centric one.

---

# Core Concepts

## Incident

An Incident is the primary entity of the application.

It documents the complete resolution of a technical problem.

An Incident typically contains:

- a title
- a description of the problem
- the investigation process
- the identified root cause
- the solution
- prevention recommendations
- code snippets
- attachments
- external references

An Incident is intended to become reusable documentation.

---

## Category

A Category represents a technical domain.

Examples:

- Docker
- Linux
- Git
- Go
- PostgreSQL
- Networking
- Kubernetes

Each Incident belongs to one Category.

Categories provide high-level organization.

---

## Tag

A Tag is a keyword describing an Incident.

Unlike Categories, Tags are flexible.

Examples:

- ssh
- permissions
- ssl
- github
- nginx
- docker-compose

An Incident may have multiple Tags.

---

## Snippet

A Snippet is a reusable piece of code or command.

Examples:

- Bash command
- SQL query
- Docker Compose
- YAML configuration
- Go code
- JSON payload

An Incident may contain multiple Snippets.

---

## Attachment

An Attachment is a file associated with an Incident.

Examples:

- screenshot
- log file
- PDF
- archive
- exported configuration

Attachments provide additional context.

---

## Link

A Link references an external resource.

Examples:

- GitHub Issue
- Official Documentation
- RFC
- Blog article
- Stack Overflow discussion

Links complement the Incident without duplicating external information.

---

## User

A User is an authenticated person using the application.

Users can:

- create Incidents
- edit Incidents
- publish Incidents
- search Incidents

---

# Incident Lifecycle

An Incident evolves through three states.

## Draft

The Incident is being written.

It is not yet considered complete.

---

## Published

The Incident is validated and available for search.

This is the normal state of a completed Incident.

---

## Archived

The Incident is no longer recommended but is kept for historical purposes.

Archived Incidents remain searchable.

---

# Design Principles

## Knowledge over Tickets

Coelbook capitalizes on knowledge.

It does not attempt to manage tickets or support requests.

A ticket is temporary.

Knowledge is permanent.

Every Incident documented here is not a ticket: it's the lasting knowledge extracted from one.

---

## Reusability

Every Incident should answer one question:

> How can someone solve this problem again in the future?

---

## Simplicity

Each Incident should describe one problem and one solution.

Avoid combining unrelated issues into the same Incident.

---

## Searchability

Information should be easy to discover.

Categories provide coarse classification.

Tags provide fine-grained classification.

Titles should clearly describe the problem.

---

## Extensibility

The domain model is intentionally simple.

Future versions may introduce:

- AI-generated summaries
- semantic search
- version history
- comments
- teams
- permissions
- relationships between Incidents

without changing the core concepts.

---

# Terminology

| Term | Definition |
|------|------------|
| Incident | A documented solution to a technical problem |
| Category | A technical domain grouping Incidents |
| Tag | A keyword used for classification |
| Snippet | A reusable code or command example |
| Attachment | A file associated with an Incident |
| Link | An external reference |
| User | An authenticated user of the application |

---

# Vision

Every solved problem should become an Incident.

Every Incident should save someone time.

The objective of Coelbook is simple:

> Never solve the same technical problem twice.