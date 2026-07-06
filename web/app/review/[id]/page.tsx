"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Circle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { fetchAgents, getReview } from "@/lib/api";
import type { Agent, AgentStatus } from "@/lib/types";
import { ParticleBackground } from "@/components/ParticleBackground";
import { CouncilChamber } from "@/components/CouncilChamber";
import { AgentDetailModal } from "@/components/AgentDetailModal";
import { ReviewReport } from "@/components/ReviewReport";
import { useReviewStream } from "@/hooks/useReviewStream";

function ReviewPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reviewId = params.id as string;
  const courseTitle = searchParams.get("title") || "";

  const [agents, setAgents] = useState<Agent[]>([]);
  const [view, setView] = useState<"chamber" | "roster">("chamber");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [resolvedTitle, setResolvedTitle] = useState(courseTitle);

  const {
    reviews,
    chiefReport,
    phase,
    error,
    startedAgents,
    completedCount,
    feedLines,
    isHistorical,
  } = useReviewStream(reviewId);

  useEffect(() => {
    fetchAgents()
      .then((data) => setAgents(data.agents))
      .catch(console.error);

    getReview(reviewId)
      .then((data) => {
        if (data.course_title) setResolvedTitle(data.course_title);
      })
      .catch(console.error);
  }, [reviewId]);

  useEffect(() => {
    if (isHistorical && chiefReport) {
      setShowReport(true);
      return;
    }
    if (phase === "done" && chiefReport) {
      const timer = setTimeout(() => setShowReport(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, chiefReport, isHistorical]);

  const agentStatuses = useMemo(() => {
    const statuses: Record<string, AgentStatus> = {};
    for (const agent of agents) {
      if (reviews[agent.id]) {
        statuses[agent.id] = "completed";
      } else if (startedAgents.has(agent.id)) {
        statuses[agent.id] = "writing";
      } else if (phase === "agents" && startedAgents.size > 0) {
        statuses[agent.id] = "waiting";
      } else {
        statuses[agent.id] = "waiting";
      }
    }
    return statuses;
  }, [agents, reviews, startedAgents, phase]);

  const selectedAgentData = useMemo(
    () => agents.find((a) => a.id === selectedAgent) ?? null,
    [agents, selectedAgent]
  );

  const handleAgentClick = useCallback((agentId: string) => {
    setSelectedAgent(agentId);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <p className="text-red-400 mb-2">评审出错</p>
          <p className="text-sm text-white/50 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="btn-primary text-sm"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <Image
          src="/hero_background.png"
          alt=""
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-council-bg/90" />
      </div>
      <ParticleBackground />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>

        <div className="text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-council-gold/50">
            Virtual Learning Council
          </p>
          <p className="font-serif text-sm text-white/70">
            {courseTitle || resolvedTitle || "共学评审进行中"}
          </p>
        </div>

        {!showReport ? (
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setView("chamber")}
              className={`rounded-md p-2 transition-all ${
                view === "chamber" ? "bg-council-gold/20 text-council-gold" : "text-white/30"
              }`}
            >
              <Circle className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("roster")}
              className={`rounded-md p-2 transition-all ${
                view === "roster" ? "bg-council-gold/20 text-council-gold" : "text-white/30"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowReport(false)}
            className="text-xs text-white/40 hover:text-council-gold transition-colors"
          >
            查看议事厅
          </button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {!showReport ? (
          <motion.div
            key="chamber"
            className="relative z-10 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Phase indicator */}
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5"
                animate={
                  phase === "chief"
                    ? { borderColor: "rgba(201,168,76,0.4)" }
                    : {}
                }
              >
                {phase === "chief" ? (
                  <>
                    <motion.div
                      className="h-2 w-2 rounded-full bg-council-gold"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-xs text-council-gold">首席评审官总结中...</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="h-2 w-2 rounded-full bg-council-blue"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-xs text-white/50">
                      共学评审进行中 · {completedCount}/{agents.length}
                    </span>
                  </>
                )}
              </motion.div>
            </div>

            {view === "chamber" ? (
              <CouncilChamber
                agents={agents}
                reviews={reviews}
                agentStatuses={agentStatuses}
                courseTitle={resolvedTitle || courseTitle}
                completedCount={completedCount}
                totalCount={agents.length}
                phase={phase === "chief" ? "chief" : phase === "done" ? "done" : "agents"}
                feedLines={feedLines}
                onAgentClick={handleAgentClick}
                view="chamber"
              />
            ) : (
              <CouncilChamber
                agents={agents}
                reviews={reviews}
                agentStatuses={agentStatuses}
                courseTitle={resolvedTitle || courseTitle}
                completedCount={completedCount}
                totalCount={agents.length}
                phase={phase === "chief" ? "chief" : "agents"}
                feedLines={feedLines}
                onAgentClick={handleAgentClick}
                view="roster"
              />
            )}

            {phase === "done" && (
              <motion.div
                className="text-center mt-16"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => setShowReport(true)}
                  className="btn-primary"
                >
                  查看综合评审报告 →
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {chiefReport && (
              <ReviewReport
                content={chiefReport}
                courseTitle={resolvedTitle || courseTitle}
                onRestart={() => router.push("/")}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent detail modal */}
      {selectedAgentData && (
        <AgentDetailModal
          agent={selectedAgentData}
          review={reviews[selectedAgentData.id] ?? null}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-council-gold/30 border-t-council-gold"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}
