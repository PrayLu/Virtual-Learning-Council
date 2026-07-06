"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { ParsedScores } from "@/lib/types";

const DIMS = ["价值", "表达", "故事", "案例", "共鸣", "逻辑", "可信度", "推荐度"];

interface ScoreRadarProps {
  scores: ParsedScores;
  color?: string;
  size?: number;
}

export function ScoreRadar({ scores, color = "#C9A84C", size = 200 }: ScoreRadarProps) {
  const data = useMemo(
    () =>
      DIMS.map((dim) => ({
        dimension: dim,
        score: scores.dimensions[dim] ?? 0,
        fullMark: 100,
      })),
    [scores]
  );

  return (
    <ResponsiveContainer width={size} height={size}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
        />
        <Radar
          name="评分"
          dataKey="score"
          stroke={color}
          fill={color}
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function ScoreRing({
  score,
  size = 120,
  color = "#C9A84C",
}: {
  score: number;
  size?: number;
  color?: string;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={6}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score.toFixed(1)}
        </motion.span>
        <span className="text-[10px] text-white/30">整体评分</span>
      </div>
    </div>
  );
}

export function CountUpScore({
  value,
  className,
  color = "#C9A84C",
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  return (
    <motion.span
      className={className}
      style={{ color }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {value.toFixed(1)}
      </motion.span>
    </motion.span>
  );
}
