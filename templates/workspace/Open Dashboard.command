#!/bin/bash
# Double-click to open your job dashboard in the browser.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Opening the download page."
  echo "Install the LTS version, then double-click this file again."
  open "https://nodejs.org/en/download"
  read -r -p "Press Enter to close."
  exit 1
fi
nohup node app/scripts/dashboard.mjs --dir . >/dev/null 2>&1 &
sleep 1
open "http://localhost:4747"
