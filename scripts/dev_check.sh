#!/usr/bin/env bash

set -euo pipefail

step() {
    printf '\n==> %s\n' "$1"
}

step "Prüfe Projektroot"

if [[ ! -f README.md || ! -d backend || ! -d frontend ]]; then
    echo "Fehler: Starte dieses Script aus dem MySaskia-Projektroot."
    echo "Erwartet werden README.md sowie die Ordner backend/ und frontend/."
    exit 1
fi

PROJECT_ROOT="$(pwd)"

if [[ -x backend/.venv/bin/python ]]; then
    PYTHON_CMD="$PROJECT_ROOT/backend/.venv/bin/python"
else
    PYTHON_CMD="python3"
    echo "Hinweis: backend/.venv/bin/python wurde nicht gefunden. Verwende python3."
fi

echo "Verwende Python: $PYTHON_CMD"

step "Git-Status"
git_status="$(git status --short)"

if [[ -n "$git_status" ]]; then
    printf '%s\n' "$git_status"
else
    echo "Keine offenen Änderungen."
fi

step "Python-Syntax"
"$PYTHON_CMD" -m py_compile backend/*.py

step "Backend-Tests"

if ! "$PYTHON_CMD" -c "import pytest" >/dev/null 2>&1; then
    echo "pytest fehlt. Richte die Backend-venv ein und installiere die Test-Abhängigkeiten:"
    echo "  cd backend"
    echo "  python3 -m venv .venv"
    echo "  source .venv/bin/activate"
    echo "  python -m pip install -r requirements-dev.txt"
    exit 1
fi

cd backend
"$PYTHON_CMD" -m pytest
cd ..

step "Zusammenfassung"

if [[ -n "$git_status" ]]; then
    echo "Hinweis: Es gibt offene Git-Änderungen."
else
    echo "Keine offenen Git-Änderungen."
fi

echo "Dev check completed successfully."
