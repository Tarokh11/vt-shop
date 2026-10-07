#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if [[ ! -f .env || ! -x .venv/bin/python || ! -d frontend/node_modules ]]; then
    echo "Missing local setup: .env, .venv/bin/python, or frontend/node_modules." >&2
    echo "Complete the local setup in README.md first." >&2
    exit 1
fi
for command in npm setsid; do
    if ! command -v "$command" >/dev/null 2>&1; then
        echo "Required command not found: $command" >&2
        exit 1
    fi
done

set -a
source .env
set +a

BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Check both ports before starting either server.
.venv/bin/python - "$BACKEND_PORT" "$FRONTEND_PORT" <<'PYTHON'
import socket
import sys

ports = sys.argv[1:]
if any(not port.isascii() or not port.isdecimal() or not 1 <= int(port) <= 65535 for port in ports):
    sys.exit("Ports must be integers between 1 and 65535.")
if int(ports[0]) == int(ports[1]):
    sys.exit("Backend and frontend ports must be different.")
for port in ports:
    with socket.socket() as sock:
        try:
            sock.bind(("127.0.0.1", int(port)))
        except OSError as error:
            sys.exit(f"Port {port} is unavailable: {error}. Set BACKEND_PORT or FRONTEND_PORT.")
PYTHON

backend_pid=""
frontend_pid=""
cleanup() {
    trap - EXIT INT TERM
    for pid in "$backend_pid" "$frontend_pid"; do
        if [[ -n "$pid" ]]; then
            kill -TERM -- "-$pid" 2>/dev/null || true
        fi
    done
    wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

setsid env DJANGO_DEBUG=true PYTHONUNBUFFERED=1 \
    FRONTEND_ORIGIN="http://127.0.0.1:$FRONTEND_PORT" \
    DJANGO_CSRF_TRUSTED_ORIGINS="${DJANGO_CSRF_TRUSTED_ORIGINS:+$DJANGO_CSRF_TRUSTED_ORIGINS,}http://127.0.0.1:$FRONTEND_PORT,http://localhost:$FRONTEND_PORT" \
    .venv/bin/python backend/manage.py runserver "127.0.0.1:$BACKEND_PORT" &
backend_pid=$!

(
    cd frontend
    exec setsid env BACKEND_ORIGIN="http://127.0.0.1:$BACKEND_PORT" \
        npm run dev -- --port "$FRONTEND_PORT"
) &
frontend_pid=$!

printf 'Storefront: http://127.0.0.1:%s\n' "$FRONTEND_PORT"
printf 'Admin: http://127.0.0.1:%s/admin/\n' "$BACKEND_PORT"
printf 'Products: http://127.0.0.1:%s/manage/products/\n' "$BACKEND_PORT"
echo "Press Ctrl+C to stop both servers."

status=0
wait -n "$backend_pid" "$frontend_pid" || status=$?
exit "$status"
