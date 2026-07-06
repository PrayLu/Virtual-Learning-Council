#!/usr/bin/env bash
# 启动 Virtual Learning Council 完整服务

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting Virtual Learning Council..."

# Backend
echo "→ API server on http://localhost:8000"
cd "$ROOT"
python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 &
API_PID=$!

# Frontend
echo "→ Web UI on http://localhost:3000"
cd "$ROOT/web"
npm run dev &
WEB_PID=$!

trap "kill $API_PID $WEB_PID 2>/dev/null" EXIT

echo ""
echo "✅ Virtual Learning Council is running"
echo "   Web:  http://localhost:3000"
echo "   API:  http://localhost:8000"
echo ""

wait
