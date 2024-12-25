import { prisma } from "~/db";
import type { Route } from "../+types";

const getSortedTokensString = async (questionId: string): Promise<string> => {
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

  return tokensString;
};

export async function loader({ params }: Route.LoaderArgs) {
  const questionId = params.questionId;
  if (!questionId) {
    return new Response("Missing questionId", { status: 400 });
  }
  const tokensString = await getSortedTokensString(questionId);
  return { tokensString };
}
