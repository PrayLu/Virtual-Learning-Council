export interface Agent {
  id: string;
  name: string;
  role: string;
  age: number | null;
  background: string;
  avatar: string;
  color: string;
  quote: string;
  concerns: string[];
}

export interface AgentReview {
  agent_id: string;
  agent_name: string;
  agent_role: string;
  content: string;
  completed_at: string;
}

export interface ChiefReport {
  content: string;
  completed_at: string;
}

export type AgentStatus = "waiting" | "reading" | "writing" | "completed";

export interface ReviewSession {
  id: string;
  status: "pending" | "running" | "completed" | "error";
  course_title: string;
  created_at: string;
  agent_reviews: AgentReview[];
  chief_report: ChiefReport | null;
  error?: string;
}

export interface ParsedScores {
  total: number;
  dimensions: Record<string, number>;
}

export function parseScores(content: string): ParsedScores | null {
  const dimNames = ["价值", "表达", "故事", "案例", "共鸣", "逻辑", "可信度", "推荐度"];
  const dimensions: Record<string, number> = {};
  let found = 0;

  for (const dim of dimNames) {
    const patterns = [
      new RegExp(`\\|\\s*${dim}\\s*\\|\\s*(\\d+(?:\\.\\d+)?)`, "i"),
      new RegExp(`${dim}[：:]\\s*(\\d+(?:\\.\\d+)?)`, "i"),
      new RegExp(`${dim}\\s+(\\d+(?:\\.\\d+)?)`, "i"),
    ];
    for (const p of patterns) {
      const m = content.match(p);
      if (m) {
        dimensions[dim] = parseFloat(m[1]);
        found++;
        break;
      }
    }
  }

  const totalMatch = content.match(/总分[：:]\s*(\d+(?:\.\d+)?)/);
  const total = totalMatch
    ? parseFloat(totalMatch[1])
    : found > 0
      ? Object.values(dimensions).reduce((a, b) => a + b, 0) / found
      : 0;

  if (found === 0 && !totalMatch) return null;
  return { total, dimensions };
}

export function extractOneLiner(content: string): string {
  const section = content.match(/##\s*第一部分[：:][^\n]*\n+([^\n#]+)/);
  if (section) return section[1].replace(/^[>「『"]|[」』">]$/g, "").trim();

  const quote = content.match(/[「『"]([^」』"]+)[」』"]/);
  return quote ? quote[1] : "";
}

export function extractStarRating(content: string): number {
  const section = content.match(/##\s*第七部分[\s\S]*?(★+)/);
  if (!section) return 0;
  return section[1].length;
}
