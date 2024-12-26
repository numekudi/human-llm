import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { prisma } from "~/db";
import { useSearchParams } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  console.log(request.url);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const take = 23;
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
}
export default function Home({ loaderData }: Route.ComponentProps) {
  const [params, _] = useSearchParams();
  const questionId = params.get("questionId");
  return (
    <Welcome
      questions={loaderData.questions}
      nextCursor={loaderData.nextCursor}
      questionId={questionId ?? undefined}
      key={questionId}
    />
  );
}
