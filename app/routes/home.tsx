import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useSearchParams } from "react-router";
import { getQuestions } from "~/repository";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Little Letter Mind" },
    { name: "description", content: "LLMの気持ちになれるwebアプリ" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  console.log(request.url);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  return await getQuestions(cursor);
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
