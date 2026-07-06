# Vercel 部署指南

## 问题原因

Vercel 在仓库根目录发现了 `main.py` + `requirements.txt`，误以为是 **FastAPI 项目**，而不是 `web/` 里的 Next.js。

现已修复：Python 文件已移走，根目录加了 `vercel.json` 强制构建 Next.js。

---

## 方案 A：推荐（Root Directory = web）

在 Vercel 控制台：

1. 项目 **Settings** → **General** → **Root Directory**
2. 填入：`web`
3. **Save** → **Deployments** → **Redeploy**

---

## 方案 B：不改 Root Directory

如果 Root Directory 留空，根目录的 `vercel.json` 和 `package.json` 会自动构建 `web/` 子项目。

直接 **Redeploy** 即可。

---

## 后端必须单独部署

评审功能需要 Python 后端（Vercel 跑不了长时间 AI 任务）。

### Railway 步骤

1. 新建项目 → GitHub 仓库
2. Start Command：
   ```bash
   pip install -r backend/requirements.txt && uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
3. 环境变量：
   ```
   OPENAI_API_KEY=你的DeepSeek密钥
   OPENAI_BASE_URL=https://api.deepseek.com
   OPENAI_MODEL=deepseek-chat
   ALLOWED_ORIGINS=https://counci.vercel.app
   ```

### Vercel 环境变量

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_API_URL` | `https://你的Railway域名` |

保存后 Redeploy。

---

## 验证

| 地址 | 期望结果 |
|------|----------|
| `https://counci.vercel.app` | Virtual Learning Council 入席页 |
| `https://后端域名/api/health` | `{"status":"ok"}` |

---

## 常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| `Found main.py but no FastAPI app` | Vercel 误识别 Python | push 最新代码后 Redeploy |
| `{"detail":"Not Found"}` | 跑了 FastAPI 不是 Next.js | 设 Root Directory = `web` |
| 页面正常但无法评审 | 后端未部署 | 部署 Railway + 配 API URL |
