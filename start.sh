#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# Autofy — start BOTH servers with one command.
# Login / AI / payments need the Python backend running, not just
# the website. This starts both and stops both on Ctrl-C.
#
# Usage:   ./start.sh      (run from the project root)
# Then open:   http://localhost:3007
# ══════════════════════════════════════════════════════════════
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "→ Starting backend (FastAPI) on http://localhost:8000 ..."
( cd "$ROOT/backend" && python3 -m uvicorn main:app --reload --port 8000 ) &
BACKEND_PID=$!

echo "→ Starting frontend (Vite) on http://localhost:3007 ..."
( cd "$ROOT" && npx vite --port 3007 --host 0.0.0.0 --strictPort ) &
FRONTEND_PID=$!

# Stop both when you press Ctrl-C
trap "echo; echo '→ Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

echo ""
echo "✅ Autofy is starting. Open →  http://localhost:3007"
echo "   (Press Ctrl-C here to stop both servers.)"
wait
