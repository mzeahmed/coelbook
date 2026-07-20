# Versioning

## Overview

Playbook follows **Semantic Versioning (SemVer)**.

Version numbers use the following format:

```
MAJOR.MINOR.PATCH
```

All Git tags are prefixed with `v`.

Example:

```
v0.1.0
v0.2.0
v1.0.0
```

---

# Version Format

```
vMAJOR.MINOR.PATCH
```

Example:

```
v0.1.0
```

- **MAJOR**: incompatible or breaking changes
- **MINOR**: new backward-compatible features
- **PATCH**: bug fixes and small improvements

---

# Development Phase

Until the first stable release, Playbook remains in the **0.x** series.

During this phase:

- the data model may evolve
- the API may change
- breaking changes are acceptable
- experimentation is encouraged

The objective is to build a solid foundation before committing to long-term compatibility.

---

# Release Strategy

A new Git tag is created only when a coherent set of features is completed.

A release must represent a usable state of the application.

Tags are **not** created for every commit.

---

# Planned Roadmap

## v0.1.0

First usable MVP.

Expected features:

- Authentication
- Playbook CRUD
- Categories
- Tags
- Search
- Docker environment
- Initial documentation

---

## v0.2.0

Knowledge improvements.

Expected features:

- Attachments
- Snippets
- External links
- Better search experience

---

## v0.3.0

Developer experience.

Expected features:

- Complete OpenAPI specification
- Pagination
- Sorting
- Filtering
- UI improvements

---

## v0.4.0

AI-powered features.

Possible features:

- AI-assisted search
- Automatic tag suggestions
- Semantic search
- Knowledge recommendations

---

## v1.0.0

First stable release.

Requirements:

- Stable API
- Stable database schema
- Complete documentation
- Production-ready Docker environment
- Reliable authentication
- Fully functional search
- Comprehensive test suite

Version 1.0.0 represents the first release considered stable for production use.

---

# Patch Releases

Patch releases are reserved for:

- bug fixes
- documentation improvements
- performance improvements
- dependency updates
- security fixes

Examples:

```
v0.1.1
v0.1.2
v0.1.3
```

---

# Release Checklist

Before creating a release:

- All planned features are completed
- Documentation is updated
- Tests pass
- Docker environment works correctly
- CHANGELOG is updated
- Version number is bumped

---

# Creating a Release

Example:

```bash
git tag -a v0.1.0 -m "Initial MVP"
git push origin v0.1.0
```

GitHub Releases should then be created from the corresponding tag.

---

# Guiding Principle

A Git tag represents a version that another developer can clone, build and use.

Every tagged version should be installable and usable.