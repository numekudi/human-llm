import {
  acceptVote,
  aggregateVotes,
  getAcceptedVote,
  getQuestionById,
} from "~/db";
import type { Route } from "./+types/sse";

type Deadline = {
  type: "deadline";
  deadline: number;
};

export type TokenCounts = {
  type: "counts";
  tokenFreq: {
    token: string;
    count: number;
  }[];
};

export type EventData = Deadline | TokenCounts;

// loader の中で SSE を構築
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const questionId = params.questionId;
  if (!questionId) {
    return new Response("Missing questionId or tokenIndex", { status: 400 });
  }

  let processingTokenIndex: number | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const proc = async () => {
        const question = await getQuestionById(questionId);
        if (!question) {
          return new Response("Question not found", { status: 404 });
        }
        processingTokenIndex = question.answerTokenLength + 1;

        // const voteCounts = await aggregateVotes(
        //   questionId,
        //   question.answerTokenLength + 1
        // );
        // if (voteCounts.length === 0) {
        //   return;
        // }
        // const dists = voteCounts.map((vote) => vote._count.token);

        // const tokenCounts = voteCounts.map((vote) => ({
        //   token: vote.token ?? "",
        //   count: vote._count.token,
        // }));

        // const counts: TokenCounts = {
        //   type: "counts",
        //   tokenFreq: tokenCounts,
        // };

        // const index = selectRandomTokenWithTemperature(dists, temperature);
        const ret = await acceptVote(questionId, processingTokenIndex);
        const newQ = ret.newQuestion;
        const counts = ret.counts;

        controller.enqueue(`data: ${JSON.stringify(counts)}\n\n`);
        processingTokenIndex = newQ.answerTokenLength;
        request.signal.addEventListener("abort", () => {
          controller.close();
        });
      };
      const setup = async () => {
        const now = new Date();
        // 次の10の倍数秒
        const nextDeadlineTime = Math.ceil(now.getTime() / 10000) * 10000;
        const deadline = nextDeadlineTime - now.getTime();
        const deadlineEvent: Deadline = {
          type: "deadline",
          deadline: deadline,
        };
        controller.enqueue(`data: ${JSON.stringify(deadlineEvent)}\n\n`);

        setTimeout(() => {
          proc();
          setup();
        }, deadline);
      };
      setup();
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
