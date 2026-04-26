#!/bin/bash
# Instaluje git hooks z scripts/hooks/ do .git/hooks/
# Użycie: ./scripts/install-hooks.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_SRC="$ROOT_DIR/scripts/hooks"
HOOKS_DST="$ROOT_DIR/.git/hooks"

if [ ! -d "$HOOKS_DST" ]; then
    echo "Błąd: $HOOKS_DST nie istnieje. Upewnij się, że jesteś w repozytorium git." >&2
    exit 1
fi

echo "Instalowanie git hooks..."

for hook in "$HOOKS_SRC"/*; do
    name="$(basename "$hook")"
    target="$HOOKS_DST/$name"

    cp "$hook" "$target"
    chmod +x "$target"
    echo "  ✓ $name → .git/hooks/$name"
done

# Nadaj też uprawnienia do głównego skryptu
chmod +x "$ROOT_DIR/scripts/watch-actions.sh"
echo "  ✓ scripts/watch-actions.sh – uprawnienia wykonywania"

echo ""
echo "Gotowe. Hook pre-push będzie uruchamiał watcher przy każdym git push."
