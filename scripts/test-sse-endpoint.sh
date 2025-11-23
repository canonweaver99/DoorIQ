#!/bin/bash

# Test SSE endpoint with curl
# Usage: ./scripts/test-sse-endpoint.sh <sessionId> [baseUrl]

SESSION_ID="${1:-}"
BASE_URL="${2:-http://localhost:3002}"

if [ -z "$SESSION_ID" ]; then
  echo "Usage: $0 <sessionId> [baseUrl]"
  echo "Example: $0 abc123 http://localhost:3002"
  exit 1
fi

echo "Testing SSE endpoint: ${BASE_URL}/api/grade/stream"
echo "Session ID: ${SESSION_ID}"
echo "---"

curl -N -X POST "${BASE_URL}/api/grade/stream" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d "{\"sessionId\": \"${SESSION_ID}\"}" \
  --no-buffer \
  -v 2>&1 | while IFS= read -r line; do
    if [[ $line == *"data: "* ]]; then
      echo "$line"
    elif [[ $line == *"< "* ]] || [[ $line == *"> "* ]]; then
      echo "$line" >&2
    else
      echo "$line"
    fi
  done

