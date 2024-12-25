import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const getSortedTokensString = async (questionId: string) => {
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
};

export const getQuestionById = async (questionId: string) => {
  return await prisma.question.findFirst({
    where: {
      id: questionId,
    },
  });
};

export const createQuestion = async (content: string, temperature: number) => {
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
};

export const createVote = async (
  questionId: string,
  tokenIndex: number,
  token: string | null
) => {
  const res = await prisma.vote.create({
    data: {
      token,
      tokenIndex,
      questionId,
      isAccepted: false,
    },
  });
  return res;
};

export const aggregateVotes = async (
  questionId: string,
  tokenIndex: number
) => {
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

export const getAcceptedVote = async (
  questionId: string,
  tokenIndex: number
) => {
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
};

export const acceptVote = async (
  questionId: string,
  newToken: string | null
) => {
  return await prisma.$transaction(async (tx) => {
    // 現在の値を取得
    const question = await tx.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error(`Record with id ${questionId} not found`);
    }

    // 新しい値を計算
    const updatedValue = `${question.answer}${newToken ?? ""}`;

    // データを更新
    const q = await tx.question.update({
      where: { id: questionId },
      data: {
        answer: updatedValue,
        answerTokenLength: question.answerTokenLength + 1,
        hasEOS: newToken === null,
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
    return q;
  });
};
