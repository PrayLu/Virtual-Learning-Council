"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Server } from "lucide-react";
import { API_BASE, checkApiHealth } from "@/lib/api";

export function ApiStatusBanner() {
  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");

  useEffect(() => {
    checkApiHealth()
      .then((ok) => setStatus(ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "checking" || status === "ok") return null;

  const isLocalhost = API_BASE.includes("localhost");

  return (
    <div className="relative z-20 mx-auto max-w-4xl px-6 mb-6">
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-300">后端 API 未连接</p>
            <p className="mt-1 text-xs text-red-200/70 leading-relaxed">
              当前尝试连接：<code className="text-red-200">{API_BASE}</code>
            </p>
            {isLocalhost ? (
              <ul className="mt-2 text-xs text-red-200/60 space-y-1 list-disc list-inside">
                <li>
                  <strong>本地开发</strong>：在项目根目录运行 <code>./start.sh</code>
                </li>
                <li>
                  <strong>Vercel 部署</strong>：需将 Python 后端部署到 Railway，并在 Vercel 设置环境变量{" "}
                  <code>NEXT_PUBLIC_API_URL</code>
                </li>
              </ul>
            ) : (
              <p className="mt-2 text-xs text-red-200/60">
                请确认 Railway 后端已启动，且 Vercel 环境变量 NEXT_PUBLIC_API_URL 配置正确。
              </p>
            )}
            <p className="mt-2 flex items-center gap-1 text-xs text-red-200/50">
              <Server className="h-3 w-3" />
              评审功能依赖后端 API，前端界面无法单独完成 AI 评审。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
