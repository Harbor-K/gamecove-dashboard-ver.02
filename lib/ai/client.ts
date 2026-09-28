import type { Briefing, CovyResponse, GameCoveContext, RecommendedQuestions } from "./context";

// 클라이언트에서 부르는 AI 함수. 모두 서버 API 라우트를 거친다 (키는 서버에만).

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  return (await res.json()) as T;
}

export const fetchRecommendedQuestions = (context: GameCoveContext) =>
  post<RecommendedQuestions>("/api/ai/recommended-questions", { context });

export const fetchBriefing = (context: GameCoveContext) => post<Briefing>("/api/ai/briefing", { context });

export const askCovy = (message: string, context: GameCoveContext) => post<CovyResponse>("/api/ai/covy", { message, context });
