# Versioning

## Overview

Coelbook follows **Semantic Versioning (SemVer)**.

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

Until the first stable release, Coelbook remains in the **0.x** series.

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

Versions are not planned in advance. The [roadmap](../architecture/roadmap.md) groups the work by theme, and a version number is chosen when a coherent set of changes is tagged, based on what was actually shipped. Released versions are described in the [CHANGELOG](../../CHANGELOG.md).

Releases become meaningful for users once Coelbook can be deployed outside the development environment (roadmap theme *Production & releases*); until then, a tag mainly marks a milestone.

Version **1.0.0** will be the first release considered stable for production use. It requires:

- Stable API
- Stable database schema
- Complete documentation
- Production-ready Docker environment
- Reliable authentication
- Fully functional search
- Comprehensive test suite

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
- CHANGELOG has a dated section for the version (`./scripts/changelog-section.sh x.y.z` prints it), and the roadmap is up to date

---

# Creating a Release

Releases are published by the `release.yml` workflow when a version tag is pushed.

1. In `CHANGELOG.md`, turn the `[Unreleased]` content into a `## [x.y.z] - YYYY-MM-DD` section, leave an empty `[Unreleased]` above it, and update the comparison links at the bottom.
2. Check the release notes the workflow will publish:

   ```bash
   ./scripts/changelog-section.sh 0.2.0
   ```

3. Merge that change into `main`, then tag the merge commit and push the tag:

   ```bash
   git switch main && git pull
   git tag -a v0.2.0 -m "Coelbook v0.2.0"
   git push origin v0.2.0
   ```

The workflow then:

- fails right away if `CHANGELOG.md` has no section for the version — nothing is published;
- builds the production image for linux/amd64 and linux/arm64 and pushes it to `ghcr.io/mzeahmed/coelbook` with the tags `0.2.0`, `0.2` and `latest`;
- creates the GitHub release `v0.2.0`, with the changelog section as its notes.

The first time an image is published, check that the package is public (repository → *Packages* → `coelbook` → *Package settings* → *Change visibility*), or installations won't be able to pull it.

---

# Guiding Principle

A Git tag represents a version that another developer can clone, build and use.

Every tagged version should be installable and usable.