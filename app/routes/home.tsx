import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { prisma } from "~/db";
import type { Question } from "@prisma/client";
import { useSearchParams } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const questions: Question[] = await prisma.question.findMany({
    take: 20,
  });

  return { questions };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const [params, _] = useSearchParams();
  const questionId = params.get("questionId");
  return (
    <Welcome
      questions={loaderData.questions}
      questionId={questionId ?? undefined}
      key={questionId}
    />
  );
}
