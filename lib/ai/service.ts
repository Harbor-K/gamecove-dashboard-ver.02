import "server-only";
import type { Briefing, CovyResponse, GameCoveContext, RecommendedQuestions } from "./context";
import { mockAskCovy, mockBriefing, mockRecommendedQuestions } from "./mock";

// AI 기능의 서버 진입점. 제공자가 정해지면 callProvider만 구현하면 된다 (UI·API 라우트는 그대로).
// 키는 .env.local의 LLM_PROVIDER / LLM_API_KEY — 서버에서만 읽는다.
// 규칙: GameCove dataset·game structure 안에서 확인 가능한 것만 답하고, 숫자를 지어내지 않는다.
//       추적(logging)되지 않는 데이터는 분석할 수 있다고 가정하지 않고, 필요한 logging을 안내한다.

type Task =
  | { kind: "recommendedQuestions"; context: GameCoveContext }
  | { kind: "briefing"; context: GameCoveContext }
  | { kind: "askCovy"; message: string; context: GameCoveContext };

function provider() {
  const name = process.env.LLM_PROVIDER;
  const apiKey = process.env.LLM_API_KEY;
  return name && apiKey ? { name, apiKey } : null;
}

export async function getRecommendedQuestions(context: GameCoveContext): Promise<RecommendedQuestions> {
  const p = provider();
  if (!p) return mockRecommendedQuestions(context);
  return (await callProvider(p, { kind: "recommendedQuestions", context })) as RecommendedQuestions;
}

export async function getBriefing(context: GameCoveContext): Promise<Briefing> {
  const p = provider();
  if (!p) return mockBriefing(context);
  return (await callProvider(p, { kind: "briefing", context })) as Briefing;
}

export async function askCovy(message: string, context: GameCoveContext): Promise<CovyResponse> {
  const p = provider();
  if (!p) return mockAskCovy(message, context);
  return (await callProvider(p, { kind: "askCovy", message, context })) as CovyResponse;
}

async function callProvider(p: { name: string; apiKey: string }, task: Task): Promise<unknown> {
  // TODO: 제공자 확정 후 구현. dataset(lib/dashboard)과 context로 프롬프트를 만들고, 응답을 위 타입으로 돌려준다.
  void p.apiKey;
  void task;
  throw new Error(`LLM provider "${p.name}" is not implemented yet`);
}
