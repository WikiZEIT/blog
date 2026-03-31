#!/bin/bash

# Submit a URL to IndexNow for search engine indexing
# Usage: ./bin/indexnow.sh <url>
# Environment: INDEXNOW_KEY must be set

set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: $0 <url>" >&2
    exit 1
fi

if [ -z "${INDEXNOW_KEY:-}" ]; then
    echo "Error: INDEXNOW_KEY environment variable is not set" >&2
    exit 1
fi

URL="$1"
HOST="jcubic.pl"
KEY_LOCATION="https://${HOST}/${INDEXNOW_KEY}.txt"

response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.indexnow.org/IndexNow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{
        \"host\": \"${HOST}\",
        \"key\": \"${INDEXNOW_KEY}\",
        \"keyLocation\": \"${KEY_LOCATION}\",
        \"urlList\": [\"${URL}\"]
    }")

case "$response" in
    200) echo "OK: URL submitted successfully" ;;
    202) echo "OK: URL accepted, pending processing" ;;
    400) echo "Error: Invalid format" >&2; exit 1 ;;
    403) echo "Error: Invalid key" >&2; exit 1 ;;
    422) echo "Error: URL doesn't match host or key issue" >&2; exit 1 ;;
    429) echo "Error: Rate limit exceeded, try later" >&2; exit 1 ;;
    *)   echo "Error: Unexpected response code $response" >&2; exit 1 ;;
esac
