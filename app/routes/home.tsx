import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { prisma } from "~/db";
import type { Question } from "@prisma/client";
import { useFetcher } from "react-router";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}
const getSortedTokensString = async (questionId: string) => {
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

export async function loader({ request }: Route.LoaderArgs) {
  const questions: Question[] = await prisma.question.findMany();
  const url = new URL(request.url);
  const questionId = url.searchParams.get("questionId");
  let question = null;
  let tokenLength = null;
  let answer = null;
  if (questionId) {
    const id = questionId;
    question = await prisma.question.findFirst({
      where: {
        id,
      },
    });
    const ans = await getSortedTokensString(id);
    tokenLength = ans.tokenLength;
    answer = ans.tokensString;
  }

  return { questions, question, answer, tokenLength };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  useEffect(() => {
    if (loaderData.question?.id) {
      const source = new EventSource(
        `/questions/${loaderData.question.id}/votes/sse?tokenIndex=${loaderData.tokenLength}`
      );
      source.onmessage = (event) => {
        console.log(event);
      };
    }
  }, []);
  return (
    <Welcome
      questions={loaderData.questions}
      currentQuestion={loaderData.question ?? undefined}
      currentAnswer={loaderData.answer ?? undefined}
      tokenLength={loaderData.tokenLength ?? undefined}
    />
  );
}
