import type { Briefing, CovyResponse, GameCoveContext, RecommendedQuestions } from "./context";
import { mockAskCovy, mockBriefing, mockRecommendedQuestions } from "./mock";

// GitHub Pages는 정적 호스팅이므로 브라우저에서 데이터 기반 mock 응답을 계산한다.

export const fetchRecommendedQuestions = (context: GameCoveContext) =>
  Promise.resolve(mockRecommendedQuestions(context) satisfies RecommendedQuestions);

export const fetchBriefing = (context: GameCoveContext) => Promise.resolve(mockBriefing(context) satisfies Briefing);

export const askCovy = (message: string, context: GameCoveContext) =>
  Promise.resolve(mockAskCovy(message, context) satisfies CovyResponse);
