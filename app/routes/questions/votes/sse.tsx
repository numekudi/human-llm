import { prisma } from "~/db";
import type { Route } from "./+types/sse";

const aggregateVotes = async (questionId: string, tokenIndex: number) => {
  const voteCounts = await prisma.vote.groupBy({
    by: ["token"], // tokenごとにグループ化
    where: {
      questionId: questionId,
      tokenIndex: tokenIndex,
    },
    _count: {
      token: true, // tokenの数をカウント
    },
  });

  return voteCounts;
};

// loader の中で SSE を構築
export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const questionId = params.questionId;
  const tokenIndex = url.searchParams.get("tokenIndex");
  if (!questionId || !tokenIndex) {
    return new Response("Missing questionId or tokenIndex", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        console.log("interval");
        // voteCounts の取得
        aggregateVotes(questionId, parseInt(tokenIndex))
          .then((voteCounts) => {
            controller.enqueue(`data: ${JSON.stringify(voteCounts)}\n\n`);
          })
          .catch((err) => {
            controller.error(err);
          });

        // 接続が切れたら終了
        if (controller.desiredSize === 0) {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
