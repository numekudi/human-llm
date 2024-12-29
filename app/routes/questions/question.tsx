import { getQuestionById, prisma } from "~/repository";
import type { Route } from "./+types/question";

export async function loader({ request, params }: Route.LoaderArgs) {
  return await getQuestionById(params.questionId);
}
