#!/usr/bin/env bash
set -euo pipefail

# Prints the CHANGELOG.md section of a version — the release notes — without
# its "## [x.y.z] - date" heading. Exits 1 if the section is missing or
# empty, so a release is never published without notes.
#
# Usage: ./scripts/changelog-section.sh 0.2.0   (a leading "v" is accepted)

version="${1:?usage: $0 <version>}"
version="${version#v}"
changelog="$(dirname "$0")/../CHANGELOG.md"

# From the version's heading to the next "## [" heading or the link
# references at the bottom ("[x]: https://…").
notes="$(awk -v v="$version" '
  index($0, "## [" v "]") == 1 { found = 1; next }
  found && (/^## \[/ || /^\[[^]]+\]: /) { exit }
  found { print }
' "$changelog")"

# Trim leading and trailing blank lines.
notes="$(printf '%s\n' "$notes" | sed -e '/./,$!d' | tac | sed -e '/./,$!d' | tac)"

if [ -z "$notes" ]; then
  echo "CHANGELOG.md has no section for version $version (expected a \"## [$version] - YYYY-MM-DD\" heading with content)" >&2
  exit 1
fi

printf '%s\n' "$notes"
