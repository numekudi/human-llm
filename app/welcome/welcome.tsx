import type { Question } from "@prisma/client";
import { useEffect, useState } from "react";
import { useFetcher, useSearchParams } from "react-router";
import QuestionForm from "~/components/questionForm";
import { QuestionList } from "~/components/questionList";

type Props = {
  questions?: Question[];
};

export function Welcome({ questions }: Props) {
  const [params, _] = useSearchParams();
  const questionId = params.get("questionId");
  const questionFetcher = useFetcher<Question>({ key: questionId || "" });
  console.dir(questionFetcher.data?.answerTokenLength);

  useEffect(() => {
    let source: EventSource | null = null;
    if (!questionId) {
      return;
    }
    if (questionId) {
      questionFetcher.load("/questions/" + questionId);
    }

    if (!questionFetcher.data) {
      console.log("start");
      source = new EventSource(`/questions/${questionId}/votes/sse`);
      source.onmessage = (event) => {
        console.dir(event.data);
        questionFetcher.load("/questions/" + questionId);
      };
    }
    return () => {
      console.log("close");
      console.log("source", source);
      source?.close();
      console.log(source?.readyState);
    };
  }, [questionId]);

  return (
    <main>
      <div className="flex h-screen text-gray-800">
        <div>
          <QuestionList questions={questions} />
        </div>
        <div className="flex-1">
          <QuestionForm
            currentQuestion={questionId ? questionFetcher.data : undefined}
            key={questionFetcher.data?.id}
          />
        </div>
      </div>
    </main>
  );
}
