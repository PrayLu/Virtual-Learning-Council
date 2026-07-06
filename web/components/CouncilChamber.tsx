"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentNode } from "./AgentNode";
import { AgentCard } from "./AgentNode";
import type { Agent, AgentReview, AgentStatus } from "@/lib/types";
import { parseScores, extractOneLiner, extractStarRating } from "@/lib/types";

interface CouncilChamberProps {
  agents: Agent[];
  reviews: Record<string, AgentReview>;
  agentStatuses: Record<string, AgentStatus>;
  courseTitle: string;
  completedCount: number;
  totalCount: number;
  phase: "agents" | "chief" | "done";
  feedLines: string[];
  onAgentClick: (agentId: string) => void;
  view: "chamber" | "roster";
}

export function CouncilChamber({
  agents,
  reviews,
  agentStatuses,
  courseTitle,
  completedCount,
  totalCount,
  phase,
  feedLines,
  onAgentClick,
  view,
}: CouncilChamberProps) {
  const agentData = useMemo(
    () =>
      agents.map((agent) => {
        const review = reviews[agent.id];
        const scores = review ? parseScores(review.content) : null;
        return {
          agent,
          review,
          status: agentStatuses[agent.id] || "waiting",
          score: scores?.total,
          oneLiner: review ? extractOneLiner(review.content) : undefined,
          starRating: review ? extractStarRating(review.content) : undefined,
        };
      }),
    [agents, reviews, agentStatuses]
  );

  if (view === "roster") {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 max-w-6xl mx-auto">
        {agentData.map(({ agent, status, score, starRating }) => (
          <AgentCard
            key={agent.id}
            name={agent.name}
            role={agent.role}
            avatar={agent.avatar}
            color={agent.color}
            quote={agent.quote}
            background={agent.background}
            status={status}
            score={score}
            starRating={starRating}
            onClick={() => onAgentClick(agent.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl aspect-square">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        {agentData.map(({ agent, status }, i) => {
          const angle = (i / agents.length) * 2 * Math.PI - Math.PI / 2;
          const x2 = 50 + 38 * Math.cos(angle);
          const y2 = 50 + 38 * Math.sin(angle);
          return (
            <motion.line
              key={agent.id}
              x1="50"
              y1="50"
              x2={x2}
              y2={y2}
              stroke={status === "completed" ? agent.color : "rgba(255,255,255,0.04)"}
              strokeWidth={status === "completed" ? 0.3 : 0.15}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: status === "completed" ? 0.6 : 0.3,
              }}
              transition={{ delay: i * 0.05, duration: 0.8 }}
            />
          );
        })}
      </svg>

      {/* Center course */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className="glass-card w-48 p-5 text-center animate-glow">
          <p className="text-[10px] tracking-widest uppercase text-council-gold/50 mb-2">今日课程</p>
          <p className="font-serif text-sm text-white/90 leading-snug line-clamp-3">
            {courseTitle || "课程评审中"}
          </p>
          <div className="mt-4">
            <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-council-gold/60 to-council-gold"
                initial={{ width: "0%" }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="mt-2 text-[10px] text-white/30">
              {phase === "chief"
                ? "首席评审官总结中..."
                : phase === "done"
                  ? "评审完成"
                  : `${completedCount}/${totalCount} 位已完成`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Agent nodes */}
      {agentData.map(({ agent, status, score, oneLiner }, i) => (
        <AgentNode
          key={agent.id}
          id={agent.id}
          name={agent.name}
          role={agent.role}
          avatar={agent.avatar}
          color={agent.color}
          status={status}
          score={score}
          oneLiner={oneLiner}
          index={i}
          total={agents.length}
          onClick={() => onAgentClick(agent.id)}
          size="md"
        />
      ))}

      {/* Live feed */}
      <div className="absolute -bottom-8 left-0 right-0 h-16 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {feedLines.slice(-3).map((line, i) => (
            <motion.p
              key={`${line}-${i}`}
              className="text-center text-xs text-white/40 mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {line}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
