#!/usr/bin/env bash
set -euo pipefail

# Exits 0 if the GitHub account git pushes with is the owner of the origin
# repository, 1 otherwise (with the reason on stderr). Used to guard
# destructive operations on the remote, such as deleting branches.
#
# The account is the one GitHub sees for the transport origin uses: the
# SSH key for git@github.com remotes, the gh CLI login for HTTPS remotes.

url="$(git remote get-url origin 2>/dev/null)" || {
  echo "no origin remote" >&2
  exit 1
}

# git@github.com:owner/repo.git, ssh://git@github.com/owner/repo.git or
# https://github.com/owner/repo(.git)
owner="$(printf '%s' "$url" | sed -nE 's#^(git@github\.com:|ssh://git@github\.com/|https://github\.com/)([^/]+)/.*#\2#p')"

if [ -z "$owner" ]; then
  echo "origin is not a GitHub repository: $url" >&2
  exit 1
fi

case "$url" in
  https://*)
    user="$(gh api user --jq .login 2>/dev/null || true)"
    how="gh CLI (run 'gh auth login' if this is empty)"
    ;;
  *)
    # GitHub answers "Hi <login>! You've successfully authenticated…" and
    # exits 1 since it provides no shell; only the greeting matters.
    user="$(ssh -T -o BatchMode=yes -o ConnectTimeout=5 git@github.com 2>&1 | sed -nE 's/^Hi ([^!]+)!.*/\1/p' || true)"
    how="SSH key"
    ;;
esac

if [ -z "$user" ]; then
  echo "could not determine your GitHub account via $how" >&2
  exit 1
fi

# GitHub logins are case-insensitive.
if [ "$(printf '%s' "$user" | tr '[:upper:]' '[:lower:]')" != "$(printf '%s' "$owner" | tr '[:upper:]' '[:lower:]')" ]; then
  echo "authenticated as '$user', but the repository belongs to '$owner'" >&2
  exit 1
fi
