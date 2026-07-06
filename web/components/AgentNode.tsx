"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/api";
import type { AgentStatus } from "@/lib/types";

interface AgentNodeProps {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  quote?: string;
  status: AgentStatus;
  score?: number;
  oneLiner?: string;
  index: number;
  total: number;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export function AgentNode({
  name,
  role,
  avatar,
  color,
  status,
  score,
  oneLiner,
  index,
  total,
  onClick,
  size = "md",
}: AgentNodeProps) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = size === "lg" ? 38 : size === "md" ? 42 : 35;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);

  const sizeMap = { sm: 48, md: 64, lg: 80 };
  const nodeSize = sizeMap[size];

  const statusRing = {
    waiting: "ring-white/10",
    reading: "ring-council-blue/60 animate-pulse",
    writing: "ring-council-gold/80 animate-pulse",
    completed: "ring-emerald-400/60",
  };

  return (
    <motion.button
      className="absolute flex flex-col items-center gap-1.5 focus:outline-none group"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5, type: "spring" }}
      onClick={onClick}
    >
      <div className="relative">
        {/* Glow effect */}
        {status === "reading" || status === "writing" ? (
          <motion.div
            className="absolute inset-0 rounded-full blur-md"
            style={{ backgroundColor: color }}
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ) : null}

        {status === "completed" ? (
          <motion.div
            className="absolute inset-0 rounded-full blur-lg"
            style={{ backgroundColor: color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1.2 }}
            transition={{ duration: 0.6 }}
          />
        ) : null}

        <div
          className={cn(
            "relative overflow-hidden rounded-full ring-2 transition-all duration-500",
            statusRing[status],
            "group-hover:ring-white/30"
          )}
          style={{ width: nodeSize, height: nodeSize }}
        >
          <Image
            src={avatar}
            alt={name}
            fill
            className="object-cover"
          />

          {status === "completed" && score !== undefined ? (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-sm font-bold text-white">{score.toFixed(0)}</span>
            </motion.div>
          ) : null}

          {status === "reading" || status === "writing" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <motion.div
                className="h-4 w-4 rounded-full border-2 border-t-transparent"
                style={{ borderColor: color, borderTopColor: "transparent" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : null}
        </div>

        {/* Color accent dot */}
        <div
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-council-bg"
          style={{ backgroundColor: color }}
        />
      </div>

      <div className="text-center max-w-[90px]">
        <p className="text-xs font-medium text-white/90 leading-tight">{name}</p>
        <p className="text-[10px] text-white/40 leading-tight">{role}</p>
      </div>

      {oneLiner && status === "completed" ? (
        <motion.p
          className="absolute top-full mt-2 w-36 text-[10px] text-white/50 text-center leading-snug hidden group-hover:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          「{oneLiner}」
        </motion.p>
      ) : null}
    </motion.button>
  );
}

// Pre-computed positions for roster grid
export function AgentCard({
  name,
  role,
  avatar,
  color,
  quote,
  background,
  status,
  score,
  starRating,
  onClick,
}: {
  name: string;
  role: string;
  avatar: string;
  color: string;
  quote: string;
  background: string;
  status: AgentStatus;
  score?: number;
  starRating?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      className="glass-card-hover cursor-pointer overflow-hidden"
      whileHover={{ y: -4 }}
      onClick={onClick}
      layout
    >
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
            <Image src={avatar} alt={name} fill className="object-cover" />
            {status === "reading" || status === "writing" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <motion.div
                  className="h-5 w-5 rounded-full border-2 border-t-transparent border-council-gold"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white/90">{name}</h3>
            <p className="text-xs text-white/40">{role}</p>
            <p className="mt-2 text-xs italic text-white/50">「{quote}」</p>
          </div>
          {status === "completed" && score !== undefined ? (
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color }}>{score.toFixed(0)}</p>
              <p className="text-[10px] text-white/30">评分</p>
              {starRating ? (
                <p className="mt-1 text-xs text-council-gold">{"★".repeat(starRating)}{"☆".repeat(5 - starRating)}</p>
              ) : null}
            </div>
          ) : (
            <div className="text-xs text-white/30">
              {status === "waiting" && "等待中"}
              {status === "reading" && "阅读中..."}
              {status === "writing" && "撰写中..."}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-white/40 line-clamp-2">{background}</p>
      </div>
    </motion.div>
  );
}
