#!/bin/bash
# Installs (or updates) Auto Job Hunt in Claude Code from this folder.
# First time:  bash install.sh
# To update:   git pull && bash install.sh   (or download the new ZIP and run its install.sh)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org, then run this again."
  open "https://nodejs.org/en/download" 2>/dev/null || true
  exit 1
fi
# The claude command: on PATH, or where Anthropic's installer puts it.
CLAUDE="$(command -v claude || true)"
[ -z "$CLAUDE" ] && [ -x "$HOME/.local/bin/claude" ] && CLAUDE="$HOME/.local/bin/claude"
if [ -z "$CLAUDE" ]; then
  echo "The claude command is not installed. Run this, then run install.sh again:"
  echo "  curl -fsSL https://claude.ai/install.sh | bash"
  exit 1
fi

# Point the plugin at this folder. Removing first also handles a new download in a different folder.
"$CLAUDE" plugin marketplace remove auto-job-hunt >/dev/null 2>&1 || true
if ! "$CLAUDE" plugin marketplace add "$DIR"; then
  echo "Could not register this folder with Claude Code. Check the folder has .claude-plugin/marketplace.json and try again."
  exit 1
fi
if ! "$CLAUDE" plugin install auto-job-hunt@auto-job-hunt; then
  "$CLAUDE" plugin update auto-job-hunt@auto-job-hunt || { echo "Could not install the plugin. Run: claude plugin install auto-job-hunt@auto-job-hunt"; exit 1; }
fi

mkdir -p "$HOME/Documents/Auto Job Hunt"
echo
echo "Auto Job Hunt is installed from: $DIR"
echo "Keep this folder. Next: open Claude in Documents/Auto Job Hunt and type: start"
