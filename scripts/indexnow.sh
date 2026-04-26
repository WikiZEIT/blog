#!/bin/bash

# Submit one or more URLs to IndexNow in a single request.
# Usage:
#   ./scripts/indexnow.sh <url> [url ...]
#   ./scripts/indexnow.sh < urls.txt
#   command-producing-urls | ./scripts/indexnow.sh
# Environment: INDEXNOW_KEY must be set

set -euo pipefail

if [ -z "${INDEXNOW_KEY:-}" ]; then
    echo "Error: INDEXNOW_KEY environment variable is not set" >&2
    exit 1
fi

urls=()
if [ "$#" -gt 0 ]; then
    urls=("$@")
else
    while IFS= read -r line; do
        [ -z "$line" ] && continue
        urls+=("$line")
    done
fi

if [ "${#urls[@]}" -eq 0 ]; then
    echo "Usage: $0 <url> [url ...]   (or pipe URLs on stdin)" >&2
    exit 1
fi

for url in "${urls[@]}"; do
    case "$url" in
        http://*|https://*) ;;
        *)
            echo "Error: URL must start with http:// or https:// – got: $url" >&2
            exit 1
            ;;
    esac
done

HOST="wikizeit.jcubic.pl"
KEY_LOCATION="https://${HOST}/${INDEXNOW_KEY}.txt"

url_list=""
sep=""
for url in "${urls[@]}"; do
    url_list+="${sep}\"${url}\""
    sep=","
done

response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.indexnow.org/IndexNow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{
        \"host\": \"${HOST}\",
        \"key\": \"${INDEXNOW_KEY}\",
        \"keyLocation\": \"${KEY_LOCATION}\",
        \"urlList\": [${url_list}]
    }")

case "$response" in
    200) echo "OK: ${#urls[@]} URL(s) submitted successfully" ;;
    202) echo "OK: ${#urls[@]} URL(s) accepted, pending processing" ;;
    400) echo "Error: Invalid format" >&2; exit 1 ;;
    403) echo "Error: Invalid key" >&2; exit 1 ;;
    422) echo "Error: URL doesn't match host or key issue" >&2; exit 1 ;;
    429) echo "Error: Rate limit exceeded, try later" >&2; exit 1 ;;
    *)   echo "Error: Unexpected response code $response" >&2; exit 1 ;;
esac
