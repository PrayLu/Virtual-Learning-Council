"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getReviewStreamUrl, getReview } from "@/lib/api";
import type { AgentReview } from "@/lib/types";

export interface ReviewEvent {
  type: string;
  data: Record<string, unknown>;
}

function safeParseData(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw || raw === "undefined") return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    console.warn("SSE 数据解析失败:", raw?.slice(0, 100));
    return null;
  }
}

export function useReviewStream(reviewId: string | null) {
  const [events, setEvents] = useState<ReviewEvent[]>([]);
  const [reviews, setReviews] = useState<Record<string, AgentReview>>({});
  const [chiefReport, setChiefReport] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "agents" | "chief" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [startedAgents, setStartedAgents] = useState<Set<string>>(new Set());
  const [completedCount, setCompletedCount] = useState(0);
  const [feedLines, setFeedLines] = useState<string[]>([]);
  const [isHistorical, setIsHistorical] = useState(false);
  const [ready, setReady] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const doneRef = useRef(false);

  const addFeed = useCallback((line: string) => {
    setFeedLines((prev) => [...prev.slice(-4), line]);
  }, []);

  const processEvent = useCallback(
    (type: string, data: Record<string, unknown>) => {
      setEvents((prev) => [...prev, { type, data }]);

      switch (type) {
        case "ping":
          break;

        case "review_started":
          addFeed("评审团已入座，共学评审开始...");
          break;

        case "agent_started": {
          const id = data.agent_id as string;
          const name = data.agent_name as string;
          setStartedAgents((prev) => new Set([...prev, id]));
          addFeed(`${name} 开始阅读课程...`);
          break;
        }

        case "agent_completed": {
          const review: AgentReview = {
            agent_id: data.agent_id as string,
            agent_name: data.agent_name as string,
            agent_role: data.agent_role as string,
            content: data.content as string,
            completed_at: data.completed_at as string,
          };
          setReviews((prev) => ({ ...prev, [review.agent_id]: review }));
          setCompletedCount((c) => c + 1);

          const oneLiner = extractQuickOneLiner(review.content);
          addFeed(
            `${review.agent_name}：${oneLiner ? `「${oneLiner}」` : "评审完成"}`
          );
          break;
        }

        case "chief_started":
          setPhase("chief");
          addFeed("首席评审官开始综合评审...");
          break;

        case "chief_completed":
          setChiefReport(data.content as string);
          setPhase("done");
          doneRef.current = true;
          addFeed("综合评审报告已生成");
          break;

        case "review_completed":
          setPhase("done");
          doneRef.current = true;
          break;

        case "error":
          setError((data.message as string) || "评审出错");
          setPhase("error");
          break;
      }
    },
    [addFeed]
  );

  // 先检查是否为历史记录，已完成则直接从 API 加载
  useEffect(() => {
    if (!reviewId) return;

    doneRef.current = false;
    setReady(false);
    setIsHistorical(false);
    setPhase("idle");
    setError(null);
    setReviews({});
    setChiefReport(null);
    setCompletedCount(0);
    setStartedAgents(new Set());
    setFeedLines([]);

    getReview(reviewId)
      .then((data) => {
        if (data.status === "completed") {
          const reviewMap: Record<string, AgentReview> = {};
          for (const r of data.agent_reviews || []) {
            reviewMap[r.agent_id] = r;
          }
          setReviews(reviewMap);
          setChiefReport(data.chief_report?.content ?? null);
          setCompletedCount(data.agent_reviews?.length ?? 0);
          setPhase("done");
          doneRef.current = true;
          setIsHistorical(true);
        } else if (data.status === "error") {
          setError(data.error || "评审出错");
          setPhase("error");
        } else {
          setPhase("agents");
        }
        setReady(true);
      })
      .catch(() => {
        setPhase("agents");
        setReady(true);
      });
  }, [reviewId]);

  // 仅对进行中的评审建立 SSE 连接
  useEffect(() => {
    if (!reviewId || !ready || isHistorical || phase === "error") return;

    const es = new EventSource(getReviewStreamUrl(reviewId));
    esRef.current = es;

    const handleEvent = (type: string) => (e: MessageEvent) => {
      const data = safeParseData(e.data);
      if (data === null) return;
      processEvent(type, data);
    };

    const eventTypes = [
      "review_started",
      "agent_started",
      "agent_completed",
      "chief_started",
      "chief_completed",
      "review_completed",
      "error",
      "ping",
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, handleEvent(type));
    }

    es.onerror = () => {
      if (doneRef.current) {
        es.close();
        return;
      }
      if (es.readyState === EventSource.CONNECTING) return;

      setError("连接中断，请刷新重试");
      setPhase("error");
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [reviewId, ready, isHistorical, phase, processEvent]);

  return {
    events,
    reviews,
    chiefReport,
    phase,
    error,
    startedAgents,
    completedCount,
    feedLines,
    isHistorical,
  };
}

function extractQuickOneLiner(content: string): string {
  const section = content.match(/##\s*第一部分[：:][^\n]*\n+([^\n#]+)/);
  if (section) return section[1].replace(/^[>「『"']|[」』"'>]$/g, "").trim().slice(0, 40);
  return "";
}
