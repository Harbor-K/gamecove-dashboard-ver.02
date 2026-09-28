import type { GameCoveContext } from "@/lib/ai/context";
import { askCovy } from "@/lib/ai/service";

export async function POST(request: Request) {
  const { message, context } = (await request.json().catch(() => ({}))) as { message?: string; context?: GameCoveContext };
  try {
    return Response.json(await askCovy(message ?? "", context ?? { page: "overview" }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
