#!/usr/bin/env bash
# Run OpenSSF Scorecard locally against this repo via Docker.
# Usage: GITHUB_AUTH_TOKEN=<your PAT> ./run-local.sh
set -euo pipefail

if [ -z "${GITHUB_AUTH_TOKEN:-}" ]; then
  echo "Error: GITHUB_AUTH_TOKEN is not set." >&2
  echo "Create a token at https://github.com/settings/tokens (public_repo scope is enough) and export it:" >&2
  echo "  export GITHUB_AUTH_TOKEN=<your token>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JSON_FILE="$(mktemp)"
OUTPUT_FILE="scorecard-report.md"

docker run -e GITHUB_AUTH_TOKEN="$GITHUB_AUTH_TOKEN" gcr.io/openssf/scorecard:stable \
  --repo=github.com/Sunbird-Spark/sunbird-spark-portal \
  --format=json --show-details > "$JSON_FILE"

python3 "$SCRIPT_DIR/json_to_md.py" "$JSON_FILE" > "$OUTPUT_FILE"
rm -f "$JSON_FILE"

echo "Report written to $OUTPUT_FILE"
