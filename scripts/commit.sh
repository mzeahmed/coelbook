#!/usr/bin/env bash
set -euo pipefail

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
#BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Displays a spinner while the supplied process is running.
spinner() {
  local pid="$1"
  local delay=0.1
  local spinstr='|/-\'
  while kill -0 "$pid" 2>/dev/null; do
    local temp=${spinstr#?}
    printf " [%c]  " "$spinstr"
    spinstr=$temp${spinstr%"$temp"}
    sleep "$delay"
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

# Runs a command in the background, shows a spinner, and prints its output only
# when it fails. A failed step stops the script before committing or pushing.
run_step() {
  local label="$1"
  shift

  echo -e "${CYAN}${label}...${NC}"

  local log
  log="$(mktemp)"

  "$@" >"$log" 2>&1 &
  local pid=$!
  spinner "$pid"

  local status=0
  wait "$pid" || status=$?

  if [ "$status" -ne 0 ]; then
    echo -e "${RED}❌ ${label} failed:${NC}"
    cat "$log"
    rm -f "$log"
    echo -e "${RED}❌ Commit/push cancelled.${NC}"
    exit 1
  fi

  rm -f "$log"
  echo -e "${GREEN}✅ ${label} OK.${NC}"
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo -e "${RED}❌ Required command not found: ${command_name}${NC}"
    exit 1
  fi
}

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo -e "${RED}❌ Required file not found: ${path}${NC}"
    exit 1
  fi
}

# Reads the commit message and the branch name from the command line.
COMMIT_MESSAGE="${1:-}"
BRANCH_NAME="${2:-}"

if [ -z "$COMMIT_MESSAGE" ]; then
  echo -e "${RED}❌ Please provide a commit message.${NC}"
  echo -e "${YELLOW}Usage: ./commit.sh \"docs: update README\" main${NC}"
  exit 1
fi

if [ -z "$BRANCH_NAME" ]; then
  echo -e "${RED}❌ Please provide a branch name.${NC}"
  echo -e "${YELLOW}Usage: ./commit.sh \"docs: update README\" main${NC}"
  exit 1
fi

# Finds and enters the repository root before running checks.
require_command git
if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo -e "${RED}❌ This script must be run from a Git repository.${NC}"
  exit 1
fi
cd "$REPO_ROOT"

# Ensures that commits are only pushed to the branch requested by the caller.
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH_NAME" != "$CURRENT_BRANCH" ]; then
  echo -e "${YELLOW}⚠️  Warning: the current branch is '${CURRENT_BRANCH}', but '${BRANCH_NAME}' was requested.${NC}"
  exit 1
fi

# Validates all required tools and project manifests before modifying Git state.
require_command make
require_command go
require_command npm
require_file "api/go.mod"
require_file "frontend/package.json"

# Runs Go formatting, static analysis, tests, compilation, and frontend checks.
run_step "🔧 Go quality checks" make check
run_step "🏗️  Go build" bash -c 'cd api && go build ./...'
run_step "🔍 Frontend lint" npm --prefix frontend run lint
run_step "🏗️  Frontend build" npm --prefix frontend run build

# Stages and commits changes only after every validation step succeeds.
echo -e "${CYAN}📦 Staging changes and creating commit...${NC}"
git add .
# Avoids failing when there are no changes to commit.
if git diff --cached --quiet; then
  echo -e "${YELLOW}ℹ️  No changes to commit. Nothing pushed.${NC}"
  exit 0
fi
git commit -m "$COMMIT_MESSAGE"
echo -e "${GREEN}✅ Commit created.${NC}"

# Pushes the new commit to the requested branch.
echo -e "${CYAN}🚀 Pushing to origin/${BRANCH_NAME}...${NC}"
git push origin "$BRANCH_NAME"
echo -e "${GREEN}✅ Push completed.${NC}"
