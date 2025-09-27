#!/usr/bin/env bash
set -euo pipefail

# Roll back to the latest 'turtle-rollback-*' tag on origin

latest_tag=$(git tag --list 'turtle-rollback-*' | sort | tail -n 1)
if [ -z "${latest_tag}" ]; then
  echo "No turtle rollback tag found" >&2
  exit 1
fi

echo "Rolling back to tag: ${latest_tag}" >&2

# Ensure we fetch tags and be on main
git fetch --tags
git checkout main
git reset --hard "${latest_tag}"

echo "Done. You are now at ${latest_tag}. Push with --force if you want to update remote:"
echo "  git push origin main --force"


