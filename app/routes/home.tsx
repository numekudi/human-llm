import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { prisma } from "~/db";
import type { Question } from "@prisma/client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const questions: Question[] = await prisma.question.findMany();

  return { questions };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome questions={loaderData.questions} />;
}
