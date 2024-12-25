import type { Question } from "@prisma/client";
import QuestionForm from "~/components/questionForm";
import { QuestionList } from "~/components/questionList";

type Props = {
  questions?: Question[];
  currentQuestion?: Question;
  currentAnswer?: string;
  tokenLength?: number;
};

export function Welcome({
  questions,
  currentQuestion,
  currentAnswer,
  tokenLength,
}: Props) {
  return (
    <main>
      <div className="flex h-screen text-gray-800">
        <div>
          <QuestionList questions={questions} />
        </div>
        <div className="flex-1">
          <QuestionForm
            currentQuestion={currentQuestion}
            currentAnswer={currentAnswer}
            tokenLength={tokenLength}
            key={currentQuestion?.id}
          />
        </div>
      </div>
    </main>
  );
}
