import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAgents() {
  const res = await fetch(`${API_BASE}/api/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function createReview(courseTitle: string, courseContent: string) {
  const res = await fetch(`${API_BASE}/api/reviews`, {
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
  const res = await fetch(`${API_BASE}/api/reviews/${reviewId}`);
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
  const res = await fetch(`${API_BASE}/api/reviews?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch review history");
  const data = await res.json();
  return data.reviews;
}

export async function deleteReview(reviewId: string) {
  const res = await fetch(`${API_BASE}/api/reviews/${reviewId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete review");
  return res.json();
}
