import type { Question } from "@prisma/client";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import QuestionForm from "~/questionForm/questionForm";
import { QuestionList } from "~/components/questionList";
import Graph from "~/graph/graph";
import type { EventData, TokenCounts } from "~/routes/questions/votes/types";

type Props = {
  questions: Question[];
  nextCursor: string | null;
  questionId?: string;
};

export function Welcome({ questions, questionId, nextCursor }: Props) {
  const [deadlineCount, setDeadlineCount] = useState<number>(0);
  const [freq, setFreq] = useState<TokenCounts>({
    tokenFreq: [],
    type: "counts",
  });
  const questionFetcher = useFetcher<Question>({ key: questionId || "" });

  useEffect(() => {
    const interval = setInterval(() => {
      setDeadlineCount(
        (prevValue) => prevValue && Math.max(0, prevValue - 100)
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    if (!questionId) {
      return;
    }
    questionFetcher.load("/questions/" + questionId);

    source = new EventSource(`/questions/${questionId}/votes/sse`);
    source.onmessage = (event) => {
      questionFetcher.load("/questions/" + questionId, {
        flushSync: true,
      });
      const d = JSON.parse(event.data) as EventData;

      if (d.type === "counts") {
        setFreq(d);
      } else if (d.type === "deadline") {
        setDeadlineCount(d.deadline);
      }
    };
    return () => {
      source?.close();
    };
  }, [questionId]);

  return (
    <main>
      <div className="flex h-screen text-gray-800">
        <div>
          <QuestionList initialQuestions={questions} firstCursor={nextCursor} />
        </div>
        <div className="flex-1">
          <QuestionForm
            currentQuestion={questionId ? questionFetcher.data : undefined}
            key={questionFetcher.data?.id}
            questionId={questionId}
            glaphSlot={<Graph deadlineCount={deadlineCount} freq={freq} />}
          />
        </div>
      </div>
    </main>
  );
}
