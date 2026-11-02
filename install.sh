#!/bin/bash
# Installs (or updates) Auto Job Hunt in Claude Code from this cloned folder.
# First time:  bash install.sh
# To update:   git pull && bash install.sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org, then run this again."
  open "https://nodejs.org/en/download" 2>/dev/null || true
  exit 1
fi
if ! command -v claude >/dev/null 2>&1; then
  echo "Claude Code is not installed. Install it from https://claude.com/claude-code, then run this again."
  exit 1
fi

if claude plugin marketplace list 2>/dev/null | grep -q "auto-job-hunt"; then
  claude plugin marketplace update auto-job-hunt
  claude plugin update auto-job-hunt@auto-job-hunt || claude plugin install auto-job-hunt@auto-job-hunt
else
  claude plugin marketplace add "$DIR"
  claude plugin install auto-job-hunt@auto-job-hunt
fi

mkdir -p "$HOME/Documents/Auto Job Hunt"
echo
echo "Auto Job Hunt is installed."
echo "Next: open Claude in the folder Documents/Auto Job Hunt and type: start"
