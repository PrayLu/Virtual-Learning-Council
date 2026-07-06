"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Sparkles } from "lucide-react";
import Image from "next/image";
import type { Agent } from "@/lib/types";

interface UploadZoneProps {
  agents: Agent[];
  onSubmit: (title: string, content: string) => void;
  loading?: boolean;
}

export function UploadZone({ agents, onSubmit, loading }: UploadZoneProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsText(file);
  }, [title]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const wordCount = content.trim().length;

  return (
    <div className="relative z-10 mx-auto max-w-4xl px-6">
      {/* Hero */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="inline-flex items-center gap-2 rounded-full border border-council-gold/20 bg-council-gold/5 px-4 py-1.5 mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="h-3.5 w-3.5 text-council-gold" />
          <span className="text-xs text-council-gold/80 tracking-widest uppercase">AI Multi-Agent Review</span>
        </motion.div>

        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight mb-4">
          <span className="gold-gradient-text">Virtual Learning Council</span>
        </h1>
        <p className="text-xl text-white/50 font-serif">虚拟共学评审团</p>
        <p className="mt-4 text-sm text-white/30 max-w-lg mx-auto">
          上传课程稿，十位真实身份的 AI 评审团成员将独立评审，<br />
          帮你在上线前完成一次「企业真实共学模拟」
        </p>
      </motion.div>

      {/* Upload area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div
          className={`glass-card relative overflow-hidden transition-all duration-300 ${
            dragOver ? "border-council-gold/40 bg-council-gold/5" : ""
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="p-8">
            <label className="flex flex-col items-center cursor-pointer group">
              <motion.div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-council-gold/10 ring-1 ring-council-gold/20"
                whileHover={{ scale: 1.05 }}
              >
                <Upload className="h-7 w-7 text-council-gold/70 group-hover:text-council-gold transition-colors" />
              </motion.div>
              <p className="text-white/70 font-medium mb-1">拖拽课程稿到此处，或点击上传</p>
              <p className="text-xs text-white/30">支持 .txt 文件，或直接粘贴逐字稿</p>
              <input
                type="file"
                accept=".txt,.md,.text"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">课程标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：论语与管理 · 第一课"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:border-council-gold/40 focus:outline-none focus:ring-1 focus:ring-council-gold/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">课程稿内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="粘贴音频逐字稿..."
                  rows={6}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:border-council-gold/40 focus:outline-none focus:ring-1 focus:ring-council-gold/20 transition-all resize-none"
                />
                {wordCount > 0 && (
                  <p className="mt-1.5 text-xs text-white/25">
                    <FileText className="inline h-3 w-3 mr-1" />
                    {wordCount.toLocaleString()} 字 · 预计评审 3-5 分钟
                  </p>
                )}
              </div>
            </div>

            <motion.button
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={!content.trim() || loading}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSubmit(title, content)}
            >
              {loading ? (
                <>
                  <motion.div
                    className="h-4 w-4 rounded-full border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  正在准备...
                </>
              ) : (
                <>请评审团入座 →</>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Agent roster preview */}
      <motion.div
        className="mt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-center text-xs text-white/30 tracking-widest uppercase mb-8">今日评审团</p>
        <div className="flex flex-wrap justify-center gap-3">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              className="group relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.05 }}
            >
              <div
                className="h-12 w-12 overflow-hidden rounded-full ring-2 transition-all duration-300 group-hover:ring-white/30"
                style={{ ringColor: agent.color + "40" } as React.CSSProperties}
              >
                <Image src={agent.avatar} alt={agent.name} width={48} height={48} className="object-cover" />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                <div className="glass-card px-3 py-2 text-center whitespace-nowrap">
                  <p className="text-xs font-medium text-white/90">{agent.name}</p>
                  <p className="text-[10px] text-white/40">{agent.role}</p>
                  <p className="text-[10px] italic text-council-gold/70 mt-0.5">「{agent.quote}」</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
