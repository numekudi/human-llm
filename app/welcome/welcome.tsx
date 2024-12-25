import type { Question } from "@prisma/client";
import { useEffect, useState } from "react";
import { useFetcher, useSearchParams } from "react-router";
import QuestionForm from "~/questionForm/questionForm";
import { QuestionList } from "~/components/questionList";
import type { EventData, TokenCounts } from "~/routes/questions/votes/sse";
import Graph from "~/graph/graph";

type Props = {
  questions?: Question[];
};

export function Welcome({ questions }: Props) {
  const [params, _] = useSearchParams();
  const questionId = params.get("questionId");
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
    if (questionId) {
      questionFetcher.load("/questions/" + questionId);
    }

    if (!questionFetcher.data) {
      source = new EventSource(`/questions/${questionId}/votes/sse`);
      source.onmessage = (event) => {
        console.log("emitted");
        questionFetcher.load("/questions/" + questionId, {
          flushSync: true,
        });
        const d = JSON.parse(event.data) as EventData;
        console.log(d);

        if (d.type === "counts") {
          setFreq(d);
        } else if (d.type === "deadline") {
          setDeadlineCount(d.deadline);
        }
      };
    }
    return () => {
      source?.close();
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
            glaphSlot={<Graph deadlineCount={deadlineCount} freq={freq} />}
          />
        </div>
      </div>
    </main>
  );
}
