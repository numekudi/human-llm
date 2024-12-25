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

type TokenCounts = {
  type: "counts";
  tokenFreq: {
    token: string;
    count: number;
  }[];
};

export type EventData = Deadline | TokenCounts;

export const selectRandomTokenWithTemperature = (
  dists: number[], // トークンの出現頻度
  temperature: number
): number => {
  // 出現頻度の合計を計算
  const total = dists.reduce((sum, value) => sum + value, 0);

  // 確率分布を計算
  const probabilities = dists.map((value) => value / total);

  // 温度を適用するヘルパー関数
  const applyTemperature = (probability: number): number => {
    if (temperature === 0) {
      return probability === Math.max(...probabilities) ? 1 : 0;
    }
    return Math.pow(probability, 1 / temperature);
  };

  // 温度を適用した新しい分布を計算
  const adjustedProbabilities = probabilities.map(applyTemperature);

  // 正規化して合計を1にする
  const adjustedTotal = adjustedProbabilities.reduce(
    (sum, value) => sum + value,
    0
  );
  const normalizedProbabilities = adjustedProbabilities.map(
    (value) => value / adjustedTotal
  );

  // 累積確率を計算
  const cumulativeProbabilities = normalizedProbabilities.reduce<number[]>(
    (acc, value) => {
      if (acc.length === 0) {
        return [value];
      }
      return [...acc, acc[acc.length - 1] + value];
    },
    []
  );

  // ランダムな値を生成し、対応するインデックスを選択
  const randomValue = Math.random();
  for (let i = 0; i < cumulativeProbabilities.length; i++) {
    if (randomValue < cumulativeProbabilities[i]) {
      return i;
    }
  }

  // フォールバック (理論上はここに到達しない)
  return dists.length - 1;
};

// loader の中で SSE を構築
export async function loader({ request, params, context }: Route.LoaderArgs) {
  const questionId = params.questionId;
  if (!questionId) {
    return new Response("Missing questionId or tokenIndex", { status: 400 });
  }

  let processedTokenIndex: number | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const proc = async () => {
        const question = await getQuestionById(questionId);
        if (!question) {
          return new Response("Question not found", { status: 404 });
        }

        const temperature = question.temperature;

        // voteCounts の取得
        const voteCounts = await aggregateVotes(
          questionId,
          question.answerTokenLength + 1
        );
        if (voteCounts.length === 0) {
          return;
        }
        // 頻度を取得
        const dists = voteCounts.map((vote) => vote._count.token);

        const tokenCounts = voteCounts.map((vote) => ({
          token: vote.token ?? "",
          count: vote._count.token,
        }));
        const counts: TokenCounts = {
          type: "counts",
          tokenFreq: tokenCounts,
        };
        if (processedTokenIndex !== question.answerTokenLength) {
          controller.enqueue(`data: ${JSON.stringify(counts)}\n\n`);
          processedTokenIndex = question.answerTokenLength;
          return;
        }

        const index = selectRandomTokenWithTemperature(dists, temperature);
        const newQ = await acceptVote(
          questionId,
          voteCounts[index].token ?? null
        );

        controller.enqueue(`data: ${JSON.stringify(counts)}\n\n`);
        processedTokenIndex = newQ.answerTokenLength;
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
