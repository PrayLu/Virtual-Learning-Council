"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { X } from "lucide-react";
import type { Agent, AgentReview } from "@/lib/types";
import { parseScores, extractOneLiner, extractStarRating } from "@/lib/types";
import { ScoreRadar } from "./ScoreRadar";

interface AgentDetailModalProps {
  agent: Agent;
  review: AgentReview | null;
  onClose: () => void;
}

export function AgentDetailModal({ agent, review, onClose }: AgentDetailModalProps) {
  const scores = review ? parseScores(review.content) : null;
  const oneLiner = review ? extractOneLiner(review.content) : "";
  const stars = review ? extractStarRating(review.content) : 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-council-surface/95 backdrop-blur-xl"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <div className="h-1" style={{ backgroundColor: agent.color }} />

          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-white/5">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/10">
              <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-medium text-white/90">{agent.name}</h2>
              <p className="text-sm text-white/40">{agent.role}{agent.age ? ` · ${agent.age}岁` : ""}</p>
              <p className="mt-2 text-sm italic text-white/50">「{agent.quote}」</p>
              {oneLiner && (
                <p className="mt-3 font-serif text-base text-council-gold/80">"{oneLiner}"</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-white/60 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
            {scores && (
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-white/5">
                <ScoreRadar scores={scores} color={agent.color} size={180} />
                <div>
                  <p className="text-4xl font-bold" style={{ color: agent.color }}>
                    {scores.total.toFixed(1)}
                  </p>
                  <p className="text-xs text-white/30 mt-1">综合评分</p>
                  {stars > 0 && (
                    <p className="mt-3 text-sm text-council-gold">
                      {"★".repeat(stars)}{"☆".repeat(5 - stars)}
                      <span className="text-white/30 text-xs ml-2">继续学习意愿</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {review ? (
              <div className="review-markdown">
                <ReactMarkdown>{review.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-white/30">
                <motion.div
                  className="h-8 w-8 rounded-full border-2 border-council-gold/30 border-t-council-gold mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-sm">正在阅读和撰写评审...</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
