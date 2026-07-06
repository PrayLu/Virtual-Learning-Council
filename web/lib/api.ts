import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`连接后端超时（${API_BASE}），请确认 API 服务已启动`);
    }
    throw new Error(
      `无法连接后端（${API_BASE}）。` +
        (API_BASE.includes("localhost")
          ? " Vercel 部署需单独部署后端并配置 NEXT_PUBLIC_API_URL。"
          : " 请检查后端是否在线。")
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchAgents() {
  const res = await fetchWithTimeout(`${API_BASE}/api/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function createReview(courseTitle: string, courseContent: string) {
  const res = await fetchWithTimeout(`${API_BASE}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ course_title: courseTitle, course_content: courseContent }),
  });
  if (!res.ok) throw new Error("Failed to create review");
  return res.json() as Promise<{ review_id: string }>;
}

export function getReviewStreamUrl(reviewId: string) {
  return `${API_BASE}/api/reviews/${reviewId}/stream`;
}

export async function getReview(reviewId: string) {
  const res = await fetchWithTimeout(`${API_BASE}/api/reviews/${reviewId}`);
  if (!res.ok) throw new Error("Failed to fetch review");
  return res.json();
}

export interface ReviewSummary {
  id: string;
  course_title: string;
  status: "pending" | "running" | "completed" | "error" | "unknown";
  created_at: string;
  completed_at: string | null;
  overall_score: number | null;
  word_count: number;
  agent_count: number;
}

export async function fetchReviewHistory(limit = 50): Promise<ReviewSummary[]> {
  const res = await fetchWithTimeout(`${API_BASE}/api/reviews?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch review history");
  const data = await res.json();
  return data.reviews;
}

export async function deleteReview(reviewId: string) {
  const res = await fetchWithTimeout(`${API_BASE}/api/reviews/${reviewId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete review");
  return res.json();
}
