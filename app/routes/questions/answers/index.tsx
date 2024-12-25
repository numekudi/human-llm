import { getSortedTokensString, prisma } from "~/db";
import type { Route } from "../+types";

export async function loader({ params }: Route.LoaderArgs) {
  const questionId = params.questionId;
  if (!questionId) {
    return new Response("Missing questionId", { status: 400 });
  }
  const tokensString = await getSortedTokensString(questionId);
  return { tokensString };
}
