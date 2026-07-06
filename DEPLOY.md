# Vercel 部署指南

## 问题原因

`{"detail":"Not Found"}` 是 **FastAPI** 的 404 响应。

Vercel 默认部署**仓库根目录**，发现了 `api/` 文件夹后把它当成 Python Serverless Function 运行，而不是部署 `web/` 里的 Next.js 前端。

---

## 第一步：Vercel 只部署前端（必做）

在 Vercel 控制台：

1. 打开项目 **counci** → **Settings** → **General**
2. 找到 **Root Directory**
3. 点击 **Edit**，填入：`web`
4. 保存后去 **Deployments** → 最新部署 → **Redeploy**

完成后访问 `https://counci.vercel.app` 应该能看到 Virtual Learning Council 入席页。

---

## 第二步：后端单独部署（评审功能需要）

前端只是界面，**AI 评审必须靠 Python 后端**（FastAPI + DeepSeek）。

推荐 [Railway](https://railway.app) 或 [Render](https://render.com)：

### Railway 部署步骤

1. 新建项目 → **Deploy from GitHub** → 选择本仓库
2. **Root Directory** 留空（用仓库根目录）
3. **Start Command**：
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
4. 环境变量：
   ```
   OPENAI_API_KEY=你的DeepSeek密钥
   OPENAI_BASE_URL=https://api.deepseek.com
   OPENAI_MODEL=deepseek-chat
   ALLOWED_ORIGINS=https://counci.vercel.app
   ```
5. 部署完成后复制 Railway 给的域名

### 验证后端

访问 `https://你的后端域名/api/health`，应返回：

```json
{"status":"ok","service":"Virtual Learning Council"}
```

---

## 第三步：Vercel 连接后端

在 Vercel 项目 → **Settings** → **Environment Variables**：

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_API_URL` | `https://你的后端域名`（不要加末尾斜杠） |

保存后 **Redeploy** 一次。

---

## 架构总览

```
用户浏览器
    ↓
Vercel（web/ Next.js 前端）  ← counci.vercel.app
    ↓ API 请求
Railway（backend/ FastAPI）   ← 你的后端域名
    ↓
DeepSeek API
```

---

## 常见问题

| 现象 | 原因 | 解决 |
|------|------|------|
| `{"detail":"Not Found"}` | Root Directory 没设成 `web` | 按第一步操作 |
| 页面正常但无法评审 | 后端未部署或 API URL 未配置 | 完成第二、三步 |
| CORS 错误 | 后端未允许 Vercel 域名 | 设置 `ALLOWED_ORIGINS` |
