"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Download, RotateCcw, Share2 } from "lucide-react";
import { ScoreRing } from "./ScoreRadar";

interface ReviewReportProps {
  content: string;
  courseTitle: string;
  overallScore?: number;
  onRestart?: () => void;
}

function extractSection(content: string, keyword: string): string[] {
  const regex = new RegExp(
    `(?:#{1,3}\\s*${keyword}[^\\n]*\\n)([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`,
    "i"
  );
  const match = content.match(regex);
  if (!match) return [];

  return match[1]
    .split("\n")
    .map((l) => l.replace(/^[\d\.\-\*🔴🟠⚪]+\s*/, "").trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

function extractFinalAdvice(content: string): string {
  const match = content.match(/>(.+)/);
  return match ? match[1].trim() : "";
}

function extractOverallScore(content: string): number | null {
  const match = content.match(/整体评分[^\d]*(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

export function ReviewReport({
  content,
  courseTitle,
  overallScore,
  onRestart,
}: ReviewReportProps) {
  const score = overallScore ?? extractOverallScore(content) ?? 0;
  const pros = extractSection(content, "最大的优点");
  const risks = extractSection(content, "最大的风险");
  const p0 = extractSection(content, "P0");
  const p1 = extractSection(content, "P1");
  const p2 = extractSection(content, "P2");
  const finalAdvice = extractFinalAdvice(content);

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VLC_评审报告_${courseTitle || "课程"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="mx-auto max-w-4xl px-6 pb-20"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Header */}
      <div className="text-center mb-12">
        <motion.p
          className="text-xs tracking-[0.3em] uppercase text-council-gold/60 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Chief Reviewer · 综合裁决
        </motion.p>
        <h2 className="font-serif text-3xl text-white/90 mb-2">
          {courseTitle || "课程评审报告"}
        </h2>
      </div>

      {/* Score */}
      <div className="flex justify-center mb-12">
        <ScoreRing score={score} size={160} />
      </div>

      {/* Pros & Risks */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-4">
            <span className="text-lg">✦</span> 最大优点
          </h3>
          <ol className="space-y-3">
            {pros.slice(0, 3).map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-white/70">
                <span className="text-emerald-400/60 font-mono text-xs mt-0.5">{i + 1}.</span>
                {item}
              </li>
            ))}
            {pros.length === 0 && (
              <p className="text-sm text-white/30">见完整报告</p>
            )}
          </ol>
        </motion.div>

        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="flex items-center gap-2 text-sm font-medium text-red-400 mb-4">
            <span className="text-lg">⚠</span> 最大风险
          </h3>
          <ol className="space-y-3">
            {risks.slice(0, 3).map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-white/70">
                <span className="text-red-400/60 font-mono text-xs mt-0.5">{i + 1}.</span>
                {item}
              </li>
            ))}
            {risks.length === 0 && (
              <p className="text-sm text-white/30">见完整报告</p>
            )}
          </ol>
        </motion.div>
      </div>

      {/* Priority suggestions */}
      <motion.div
        className="glass-card p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="section-title mb-6">修改建议</h3>
        <div className="space-y-4">
          {p0.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs font-medium text-red-400 mb-2">🔴 P0 — 必须修改</p>
              <ul className="space-y-1.5">
                {p0.map((item, i) => (
                  <li key={i} className="text-sm text-white/70">· {item}</li>
                ))}
              </ul>
            </div>
          )}
          {p1.length > 0 && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-xs font-medium text-orange-400 mb-2">🟠 P1 — 建议修改</p>
              <ul className="space-y-1.5">
                {p1.map((item, i) => (
                  <li key={i} className="text-sm text-white/70">· {item}</li>
                ))}
              </ul>
            </div>
          )}
          {p2.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs font-medium text-white/40 mb-2">⚪ P2 — 可优化</p>
              <ul className="space-y-1.5">
                {p2.map((item, i) => (
                  <li key={i} className="text-sm text-white/60">· {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>

      {/* Final advice */}
      {finalAdvice && (
        <motion.div
          className="relative mb-10 overflow-hidden rounded-2xl border border-council-gold/30 bg-gradient-to-br from-council-gold/10 to-transparent p-8 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.08),transparent)]" />
          <p className="relative text-xs tracking-widest uppercase text-council-gold/60 mb-3">
            给研发团队的最后建议
          </p>
          <p className="relative font-serif text-xl text-white/90 leading-relaxed">
            「{finalAdvice}」
          </p>
        </motion.div>
      )}

      {/* Full markdown report */}
      <motion.div
        className="glass-card p-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <h3 className="section-title mb-4">完整报告</h3>
        <div className="review-markdown">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 hover:bg-white/10 transition-all"
        >
          <Download className="h-4 w-4" />
          导出 Markdown
        </button>
        <button
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 hover:bg-white/10 transition-all"
          onClick={() => navigator.clipboard.writeText(content)}
        >
          <Share2 className="h-4 w-4" />
          复制报告
        </button>
        {onRestart && (
          <button
            onClick={onRestart}
            className="flex items-center gap-2 rounded-xl border border-council-gold/20 bg-council-gold/5 px-6 py-3 text-sm text-council-gold hover:bg-council-gold/10 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            重新评审
          </button>
        )}
      </div>
    </motion.div>
  );
}
