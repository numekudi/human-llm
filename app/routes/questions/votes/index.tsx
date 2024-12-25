import { z } from "zod";
import type { Route } from "./+types/vote";
import { createVote, prisma } from "~/db";

const voteSchema = z.object({
  token: z.string().max(1, "Token must be a single character").optional(), // 最大1文字
  tokenIndex: z.coerce.number().int(), // 整数
  isEOS: z.boolean().optional(), // 真偽値
});

export async function action({ request, params }: Route.ActionArgs) {
  const questionId = params.questionId;

  if (!questionId) {
    return new Response("Missing questionId", { status: 400 });
  }

  if (request.method === "POST") {
    const formData = Object.fromEntries(await request.formData());
    const data = voteSchema.parse(formData);
    const res = await createVote(
      questionId,
      data.tokenIndex,
      data.token ?? null
    );
    return res;
  }
}
