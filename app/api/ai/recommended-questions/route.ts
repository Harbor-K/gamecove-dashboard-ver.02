import type { GameCoveContext } from "@/lib/ai/context";
import { getRecommendedQuestions } from "@/lib/ai/service";

export async function POST(request: Request) {
  const { context } = (await request.json().catch(() => ({}))) as { context?: GameCoveContext };
  try {
    return Response.json(await getRecommendedQuestions(context ?? { page: "explore" }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
