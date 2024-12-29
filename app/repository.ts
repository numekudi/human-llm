import { PrismaClient } from "@prisma/client";
import type { TokenCounts } from "./routes/questions/votes/types";

function createRetryFunction<T, A extends any[]>(
  func: (...args: A) => Promise<T>,
  retryCount: number
): (...args: A) => Promise<T> {
  return async (...args: A): Promise<T> => {
    let attempt = 0;
    while (attempt < retryCount) {
      try {
        return await func(...args); // 関数を実行
      } catch (error) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        console.warn(`Attempt ${attempt} failed. Retrying...`, error);
        if (attempt >= retryCount) {
          throw new Error(`Function failed after ${retryCount} attempts`);
        }
      }
    }
    throw new Error("Unreachable code");
  };
}

export const prisma = new PrismaClient();

export const getSortedTokensString = createRetryFunction(
  async (questionId: string) => {
    // データベースから対象のVoteを取得
    const votes = await prisma.vote.findMany({
      where: {
        questionId: questionId,
        isAccepted: true,
      },
      orderBy: {
        tokenIndex: "asc", // tokenIndexで昇順ソート
      },
      select: {
        token: true, // 必要なフィールドだけ取得
      },
    });

    // tokenを連結して1つの文字列にする
    const tokensString = votes.map((vote) => vote.token).join("");

    return { tokenLength: votes.length, tokensString };
  },
  3
);

export const getQuestionById = createRetryFunction(
  async (questionId: string) => {
    return await prisma.question.findUnique({
      where: {
        id: questionId,
      },
    });
  },
  3
);

export const createQuestion = createRetryFunction(
  async (content: string, temperature: number) => {
    const res = await prisma.question.create({
      data: {
        content,
        temperature,
        answer: "",
        answerTokenLength: 0,
        hasEOS: false,
      },
    });
    return res;
  },
  3
);

export const getQuestions = createRetryFunction(
  async (cursor: string | null) => {
    const take = 10;
    const questions = await prisma.question.findMany({
      take,
      skip: cursor ? 1 : 0, // 最初のアイテムをスキップ（カーソルの重複を防ぐ）
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });
    return {
      questions,
      nextCursor:
        questions.length === take ? questions[questions.length - 1].id : null, // 次のカーソル
    };
  },
  3
);

export const createVote = createRetryFunction(
  async (questionId: string, tokenIndex: number, token: string | null) => {
    const res = await prisma.vote.create({
      data: {
        token,
        tokenIndex,
        questionId,
        isAccepted: false,
      },
    });
    return res;
  },
  3
);

export const aggregateVotes = createRetryFunction(
  async (questionId: string, tokenIndex: number) => {
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
  },
  3
);

export const getAcceptedVote = createRetryFunction(
  async (questionId: string, tokenIndex: number) => {
    return await prisma.vote.findFirst({
      where: {
        questionId: questionId,
        tokenIndex: tokenIndex,
        isAccepted: true,
      },
      orderBy: {
        tokenIndex: "asc", // tokenIndexで昇順ソート
      },
    });
  },
  3
);

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

export const acceptVote = createRetryFunction(
  async (questionId: string, processingTokenIndex: number) => {
    return await prisma.$transaction(async (tx) => {
      // 現在の値を取得
      const question = await tx.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new Error(`Record with id ${questionId} not found`);
      }
      if (question.hasEOS) {
        return;
      }

      const voteCounts = await tx.vote.groupBy({
        by: ["token"], // tokenごとにグループ化
        where: {
          questionId: questionId,
          tokenIndex: processingTokenIndex,
        },
        _count: {
          token: true, // tokenの数をカウント
        },
      });
      const dists = voteCounts.map((vote) => vote._count.token);
      const tokenCounts = voteCounts.map((vote) => ({
        token: vote.token ?? "",
        count: vote._count.token,
      }));
      const counts: TokenCounts = {
        type: "counts",
        tokenFreq: tokenCounts,
      };

      if (
        question.answerTokenLength === processingTokenIndex ||
        tokenCounts.length === 0
      ) {
        // 処理済み
        return { counts, newQuestion: question };
      }

      const index = selectRandomTokenWithTemperature(
        dists,
        question.temperature
      );

      const newToken = tokenCounts[index].token;

      // 新しい値を計算
      const updatedValue = `${question.answer}${newToken ?? ""}`;

      // データを更新
      const newQuestion = await tx.question.update({
        where: { id: questionId },
        data: {
          answer: updatedValue,
          answerTokenLength:
            question.answerTokenLength +
            1 +
            (question.answerTokenLength + 1 >= 1024 ? 1 : 0),
          hasEOS: newToken === "" || question.answerTokenLength + 1 >= 1024,
        },
      });
      await tx.vote.updateMany({
        where: {
          questionId: questionId,
        },
        data: {
          isAccepted: true,
        },
      });
      return { newQuestion, counts };
    });
  },
  3
);
