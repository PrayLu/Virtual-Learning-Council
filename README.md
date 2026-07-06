# Virtual Learning Council

> 虚拟共学评审团 — AI 多智能体课程评审系统

## 产品定位

研发人员上传一篇课程稿（音频逐字稿）后，系统自动启动十位不同身份、不同岗位、不同思维方式的 AI Agent。每位 Agent 以**真实人物**的身份独立评审，最终由 Chief Reviewer 生成完整课程评审报告。

帮助课程在真正上线前，完成一次「企业真实共学模拟」。

## 快速开始（本地开发）

```bash
# 1. 配置 DeepSeek API Key
cp .env.example .env
# 编辑 .env，填入你的 DeepSeek API Key

# 2. 一键启动（自动检查依赖、等待 API 就绪）
./start.sh
```

打开 http://localhost:3000 即可使用。

本地配置说明：
- **LLM**：DeepSeek（`deepseek-chat`），配置在项目根目录 `.env`
- **API**：http://localhost:8000（自动启动）
- **Web**：http://localhost:3000（`web/.env.local` 已指向本地 API）

验证 API 是否正常：
```bash
curl http://localhost:8000/api/health
# 应返回 "provider": "DeepSeek", "model": "deepseek-chat"
```

> **部署到 Vercel？** 详见 [DEPLOY.md](./DEPLOY.md)

- **Web UI**：http://localhost:3000
- **API**：http://localhost:8000

## 快速开始（CLI）

```bash
python cli.py examples/sample_course.txt --title "论语与管理"
```

## 系统流程

```
上传课程稿 → 启动 AI 评审 → 多位 Agent 独立阅读 → 独立输出反馈 → Chief Reviewer 总结 → 生成评审报告
```

## 评审团成员（V1）

| # | 姓名 | 身份 |
|---|------|------|
| 01 | 张建国 | 企业董事长 |
| 02 | 李明辉 | 总经理 |
| 03 | 陈雅婷 | HRD |
| 04 | 王磊 | 销售总监 |
| 05 | 赵卫东 | 中层管理者 |
| 06 | 刘芳 | 基层员工 |
| 07 | 林晓雨 | 95后年轻员工 |
| 08 | 周文彬 | 企业教练 |
| 09 | 孙明德 | 经典导师 |
| 10 | 何清源 | AI时代专家 |

每位成员均有独立人设档案（`agents/*.yaml`）和精致 AI 生成头像（`web/public/avatars/`）。

## 项目结构

```
Virtual Learning Council/
├── agents/                  # 评审团成员人设档案（独立 YAML）
├── backend/                 # FastAPI 后端 + SSE 流式推送
│   └── main.py
├── web/                     # Next.js 前端（暗色议事厅 UI）
│   ├── app/                 # 入席页 + 议事厅 + 综合报告
│   ├── components/
│   └── public/avatars/      # AI 生成的人物头像
├── src/                     # 多智能体编排核心
├── examples/
├── cli.py                   # CLI 入口
└── start.sh                 # 一键启动脚本
```

## Web UI 功能

- **入席页**：拖拽上传课程稿，预览十位评审团成员
- **议事厅**：辐射式布局，实时显示每位 Agent 阅读/完成状态
- **评审详情**：点击成员查看七部分评审 + 雷达图评分
- **综合报告**：Chief Reviewer 裁决书风格报告，P0/P1/P2 优先级

## 架构设计

- **Multi-Agent Architecture**：每位 Agent 拥有独立的 `system_prompt`，互不共享
- **真实人物设计**：不是角色标签，而是有姓名、年龄、经历的具体人物
- **并行评审 + SSE**：十位 Agent 并发执行，前端实时更新
- **固定输出格式**：七部分结构化反馈 + P0/P1/P2 优先级建议

## 路线图

| 阶段 | 内容 |
|------|------|
| **V1** ✅ | 10 位通用评审团成员 + Chief Reviewer + Web UI |
| V2 | 行业 Agent（制造业董事长、教育校长等） |
| V3 | Agent 之间辩论讨论 |
| V4 | 历史学习能力，自动优化课程 |
