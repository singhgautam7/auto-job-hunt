#!/bin/bash
# Runs every self-test. Usage: bash test.sh
cd "$(dirname "$0")"
status=0
for f in scan dashboard check-live make-pdf start-dashboard doctor; do
  printf '%-16s ' "$f"
  node "scripts/$f.mjs" --self-test || status=1
done
exit $status
