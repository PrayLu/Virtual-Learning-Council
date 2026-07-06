#!/usr/bin/env bash
# 启动 Virtual Learning Council 完整服务（本地开发）

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "🚀 Virtual Learning Council 本地启动"
echo ""

# 检查 .env
if [ ! -f ".env" ]; then
  echo "❌ 未找到 .env 文件"
  echo "   请运行: cp .env.example .env"
  echo "   然后填入 DeepSeek API Key"
  exit 1
fi

# 检查 DeepSeek API Key
if ! grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null; then
  echo "❌ .env 中未配置有效的 OPENAI_API_KEY（DeepSeek Key）"
  exit 1
fi

echo "✓ DeepSeek API 配置已找到"
echo "  BASE_URL: $(grep OPENAI_BASE_URL .env | cut -d= -f2)"
echo "  MODEL:    $(grep OPENAI_MODEL .env | cut -d= -f2)"
echo ""

# 检查 Python 依赖
if ! python3 -c "import fastapi, openai" 2>/dev/null; then
  echo "→ 安装 Python 依赖..."
  pip3 install -r backend/requirements.txt -q
fi

# 检查前端依赖
if [ ! -d "web/node_modules" ]; then
  echo "→ 安装前端依赖..."
  npm install --prefix web -q
fi

# 确保前端指向本地 API
if [ ! -f "web/.env.local" ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > web/.env.local
  echo "✓ 已创建 web/.env.local"
fi

# 启动后端
echo "→ 启动 API  http://localhost:8000"
python3 -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 &
API_PID=$!

# 等待 API 就绪
echo -n "→ 等待 API 启动"
for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo " ✓"
    break
  fi
  echo -n "."
  sleep 1
  if [ "$i" -eq 15 ]; then
    echo ""
    echo "❌ API 启动失败，请检查上方错误日志"
    kill $API_PID 2>/dev/null
    exit 1
  fi
done

# 验证 DeepSeek 配置
HEALTH=$(curl -sf http://127.0.0.1:8000/api/health)
echo "✓ API 健康检查通过"
echo "  LLM: $(echo $HEALTH | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['llm']['provider']+' / '+d['llm']['model'])" 2>/dev/null || echo 'DeepSeek')"
echo ""

# 启动前端
echo "→ 启动 Web  http://localhost:3000"
cd "$ROOT/web"

# 清理损坏的构建缓存，避免 framer-motion ENOENT
rm -rf .next

# 释放可能被占用的 3000 端口
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "→ 释放 3000 端口（停止旧的前端进程）"
  lsof -ti:3000 | xargs kill 2>/dev/null || true
  sleep 1
fi

npm run dev &
WEB_PID=$!

trap "kill $API_PID $WEB_PID 2>/dev/null" EXIT

echo ""
echo "✅ 本地服务已就绪"
echo "   Web:  http://localhost:3000"
echo "   API:  http://localhost:8000"
echo "   LLM:  DeepSeek (deepseek-chat)"
echo ""
echo "按 Ctrl+C 停止"
echo ""

wait
