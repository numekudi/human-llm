import { z } from "zod";
import type { Route } from "./+types/question";
import { createQuestion, getQuestions, prisma } from "~/repository";
import { redirect } from "react-router";

const questionSchema = z.object({
  id: z.number().int().nonnegative().optional(), // autoincrement, optional for creation
  content: z.string().max(1024, "Content must be at most 1024 characters long"),
  Vote: z.array(z.any()).optional(), // Assuming Vote validation is elsewhere
  temperature: z.coerce
    .number()
    .min(0, "Temperature must be at least 0")
    .max(2, "Temperature must be at most 2"),
  createdAt: z.date().optional(), // Automatically handled by default in the model
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "POST") {
    const formData = Object.fromEntries(await request.formData());
    const data = questionSchema.parse(formData);
    const res = await createQuestion(data.content, data.temperature);
    return redirect(`/?questionId=${res.id}`);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  console.log(request.url);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  return await getQuestions(cursor);
}
