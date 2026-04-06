#!/bin/bash
# Watches GitHub Actions for the latest push and plays a sound when done.
# Runs in the background, started automatically by the pre-push git hook.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOUND="$SCRIPT_DIR/beep-6.mp3"
PID_FILE="$SCRIPT_DIR/.watcher.pid"
LOG_FILE="$SCRIPT_DIR/.watcher.log"
POLL_INTERVAL=5   # seconds between polls

# Detect GitHub repo from git remote
REMOTE_URL=$(git -C "$(dirname "$SCRIPT_DIR")" remote get-url origin 2>/dev/null)
REPO=$(echo "$REMOTE_URL" \
    | sed 's|.*github\.com[:/]\(.*\)\.git|\1|' \
    | sed 's|.*github\.com[:/]\(.*\)|\1|')

BRANCH=$(git -C "$(dirname "$SCRIPT_DIR")" rev-parse --abbrev-ref HEAD 2>/dev/null)
COMMIT_SHA=$(git -C "$(dirname "$SCRIPT_DIR")" rev-parse HEAD 2>/dev/null)

log() {
    echo "[watch-actions] $(date '+%H:%M:%S') $*" | tee -a "$LOG_FILE"
}

play_sound() {
    mpg123 -q "$SOUND" 2>/dev/null
}

# Kill any existing watcher
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        log "Zatrzymuję poprzedni watcher (PID $OLD_PID)"
        kill "$OLD_PID" 2>/dev/null
    fi
fi

echo $$ > "$PID_FILE"
> "$LOG_FILE"  # Reset log

log "Repo:   $REPO"
log "Branch: $BRANCH"
log "Commit: ${COMMIT_SHA:0:7}"
log "Czekam na start workflow..."

# Wait for the workflow to register in GitHub (usually 10-20s after push)
sleep 15

ATTEMPTS=0
MAX_ATTEMPTS=60  # ~20 min max (60 × 20s)

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    ATTEMPTS=$((ATTEMPTS + 1))

    RUN_JSON=$(gh run list \
        --repo "$REPO" \
        --commit "$COMMIT_SHA" \
        --limit 1 \
        --json status,conclusion,displayTitle,databaseId \
        2>/dev/null)

    if [ -z "$RUN_JSON" ] || [ "$RUN_JSON" = "[]" ]; then
        log "Workflow jeszcze nie znaleziony (próba $ATTEMPTS)..."
        sleep $POLL_INTERVAL
        continue
    fi

    STATUS=$(echo "$RUN_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['status'])" 2>/dev/null)
    CONCLUSION=$(echo "$RUN_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0].get('conclusion',''))" 2>/dev/null)
    TITLE=$(echo "$RUN_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0].get('displayTitle',''))" 2>/dev/null)

    log "Status: $STATUS | Conclusion: $CONCLUSION | $TITLE"

    if [ "$STATUS" = "completed" ]; then
        log "Gotowe! Conclusion: $CONCLUSION"
        play_sound
        rm -f "$PID_FILE"
        exit 0
    fi

    sleep $POLL_INTERVAL
done

log "Timeout — workflow nie zakończył się w ciągu 20 minut."
play_sound  # Zagraj też przy timeoucie żeby nie czekać w nieskończoność
rm -f "$PID_FILE"
exit 1
