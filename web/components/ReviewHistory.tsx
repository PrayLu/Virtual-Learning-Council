"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, FileText, Trash2, ChevronRight, Star } from "lucide-react";
import { fetchReviewHistory, deleteReview, type ReviewSummary } from "@/lib/api";

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  completed: { text: "已完成", color: "text-emerald-400" },
  running: { text: "评审中", color: "text-council-blue" },
  pending: { text: "等待中", color: "text-white/40" },
  error: { text: "出错", color: "text-red-400" },
};

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReviewHistory() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetchReviewHistory()
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("确定删除这条评审记录？")) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("删除失败");
    }
  };

  if (loading) {
    return (
      <div className="mt-16 text-center">
        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-council-gold/30 border-t-council-gold" />
      </div>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <motion.div
      className="relative z-10 mx-auto max-w-4xl px-6 mt-20 pb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-lg text-white/70">评审记录</h2>
        <span className="text-xs text-white/25">{reviews.length} 条</span>
      </div>

      <div className="space-y-3">
        {reviews.map((review, i) => {
          const status = STATUS_LABEL[review.status] ?? STATUS_LABEL.pending;
          return (
            <motion.div
              key={review.id}
              className="glass-card-hover group flex items-center gap-4 p-4 cursor-pointer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() =>
                router.push(
                  `/review/${review.id}?title=${encodeURIComponent(review.course_title)}`
                )
              }
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-council-gold/10">
                <FileText className="h-4 w-4 text-council-gold/60" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-white/80 truncate">
                  {review.course_title || "未命名课程"}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-white/30">
                    <Clock className="h-3 w-3" />
                    {formatDate(review.completed_at || review.created_at)}
                  </span>
                  <span className="text-[10px] text-white/25">
                    {review.word_count.toLocaleString()} 字
                  </span>
                  <span className={`text-[10px] ${status.color}`}>{status.text}</span>
                </div>
              </div>

              {review.overall_score != null && review.status === "completed" ? (
                <div className="flex items-center gap-1 text-council-gold">
                  <Star className="h-3.5 w-3.5 fill-council-gold/30" />
                  <span className="text-lg font-bold">{review.overall_score.toFixed(1)}</span>
                </div>
              ) : null}

              <button
                onClick={(e) => handleDelete(e, review.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-council-gold/50 transition-colors" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
