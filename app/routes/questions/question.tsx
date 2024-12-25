import { prisma } from "~/db";
import type { Route } from "./+types/question";

export async function loader({ request, params }: Route.LoaderArgs) {
  return await prisma.question.findUnique({
    where: {
      id: params.questionId,
    },
  });
}
