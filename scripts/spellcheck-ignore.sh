#!/bin/bash
# Pobiera z cspell wszystkie nierozpoznane słowa i dopisuje je do project-words.txt.
# Użycie: ./scripts/spellcheck-ignore.sh
#
# Słowa już obecne w słowniku są pomijane (porównanie bez uwzględniania wielkości
# liter). Nowe słowa trafiają na koniec pliku w sekcji "Auto-added words".

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DICT_FILE="$ROOT_DIR/project-words.txt"

if [ ! -f "$DICT_FILE" ]; then
    echo "Błąd: nie znaleziono $DICT_FILE" >&2
    exit 1
fi

cd "$ROOT_DIR"

echo "Skanowanie projektu za pomocą cspell..."

UNKNOWN="$(npx --no-install cspell lint --no-progress --words-only --unique \
    "src/**/*.md" "src/**/*.liquid" ".eleventy.js" "scripts/*.mjs" "api/**/*.php" \
    2>/dev/null || true)"

if [ -z "$UNKNOWN" ]; then
    echo "Brak nowych słów do dodania."
    exit 0
fi

EXISTING="$(grep -v '^\s*#' "$DICT_FILE" | grep -v '^\s*$' | tr '[:upper:]' '[:lower:]' | sort -u)"

NEW_WORDS="$(echo "$UNKNOWN" | awk 'NF' | sort -u | while IFS= read -r word; do
    lower="$(echo "$word" | tr '[:upper:]' '[:lower:]')"
    if ! echo "$EXISTING" | grep -Fxq "$lower"; then
        echo "$word"
    fi
done)"

if [ -z "$NEW_WORDS" ]; then
    echo "Wszystkie nierozpoznane słowa są już w słowniku."
    exit 0
fi

COUNT="$(echo "$NEW_WORDS" | wc -l | tr -d ' ')"

if ! grep -q '^# Auto-added words' "$DICT_FILE"; then
    printf '\n# Auto-added words\n' >> "$DICT_FILE"
fi

echo "$NEW_WORDS" >> "$DICT_FILE"

echo "Dodano $COUNT nowych słów do $DICT_FILE:"
echo "$NEW_WORDS" | sed 's/^/  + /'
