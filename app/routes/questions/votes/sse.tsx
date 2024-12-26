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
  let isClosed = false;

  request.signal.addEventListener("abort", () => {
    console.log("closing...");
    isClosed = true;
  });

  const stream = new ReadableStream({
    start(controller) {
      console.log("start");
      const proc = async () => {
        const question = await getQuestionById(questionId);
        if (!question) {
          return new Response("Question not found", { status: 404 });
        }

        processingTokenIndex = question.answerTokenLength + 1;

        const ret = await acceptVote(questionId, processingTokenIndex);
        console.log(!!ret);
        if (ret) {
          const newQ = ret.newQuestion;
          const counts = ret.counts;

          controller.enqueue(`data: ${JSON.stringify(counts)}\n\n`);
          processingTokenIndex = newQ.answerTokenLength;
        }
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

        const id = setTimeout(async () => {
          console.log(isClosed);
          if (isClosed) {
            clearTimeout(id);
            controller.close();
            return;
          }
          await proc();
          await setup();
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
