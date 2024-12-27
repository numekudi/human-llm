import { Form } from "react-router";
import React, { useEffect, useState } from "react";
import type { Question } from "@prisma/client";
import { MessageDisplay } from "../components/messageDisplay";

type Props = {
  currentQuestion?: Question;
  questionId?: string;
  glaphSlot?: React.ReactNode;
};

const QuestionForm = ({ currentQuestion, glaphSlot, questionId }: Props) => {
  const [temperature, setTemperature] = useState(
    currentQuestion?.temperature ?? 0.2
  );

  const [voted, setVoted] = useState(false);

  const [content, setContent] = useState("");

  useEffect(() => {
    setVoted(false);
  }, [currentQuestion?.answerTokenLength]);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <Form
          method="post"
          action={
            currentQuestion
              ? `/questions/${currentQuestion.id}/votes`
              : "/questions"
          }
          className="flex flex-col h-full"
          navigate={false}
          onSubmit={() => {
            setContent("");
            setVoted(true);
          }}
        >
          <div className="flex flex-col md:flex-row flex-1 overflow-auto w-full h-full">
            <div className="flex flex-col flex-1 w-full h-full">
              <div className="flex-1 w-full">
                {!questionId && (
                  <div className="flex flex-col justify-center h-full">
                    <div className="bg-white text-black p-8 max-w-4xl mx-auto rounded-lg shadow-lg">
                      <h1 className="text-2xl md:text-4xl font-bold mb-4 text-center">
                        Little Letter Mind 🧠
                      </h1>
                      <p className="text-lg md:text-xl mb-6 text-center text-gray-600">
                        0.1 token per second.
                        答えは一文字ずつ、みんなの力で作り上げる。 ✍️
                      </p>

                      <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-gray-800">
                            ⏱️
                          </span>
                          <p className="text-gray-900">
                            10秒ごとに一文字決定されます ⏳
                          </p>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-gray-800">
                            🔀
                          </span>
                          <p className="text-gray-900">
                            「温度」を調整して、ランダムさをコントロール！🌡️
                          </p>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-gray-800">
                            ⚠️
                          </span>
                          <p className="text-gray-900">
                            入力内容は誰でも見れます。個人情報は入力しないでください🔒
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {currentQuestion && (
                  <>
                    <input
                      type="hidden"
                      name="tokenIndex"
                      value={currentQuestion.answerTokenLength + 1}
                    />
                    <MessageDisplay
                      content={currentQuestion.content}
                      variant="user"
                    />
                    <MessageDisplay
                      content={currentQuestion.answer}
                      variant="assistant"
                    />
                    <p className="pr-4 text-end text-gray-500">{`${
                      1024 - currentQuestion.answerTokenLength
                    }/1024`}</p>
                    {!currentQuestion.hasEOS && glaphSlot}
                    {currentQuestion.hasEOS && (
                      <div className="text-center">EOS token found.</div>
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-col w-full p-4 items-center">
                {!currentQuestion?.hasEOS && (
                  <div
                    className={
                      "p-4 flex flex-col items-end border-t bg-white bottom-0 border rounded-lg " +
                      (currentQuestion ? "w-64" : "w-full")
                    }
                  >
                    <label className="block w-full">
                      <textarea
                        name={currentQuestion ? "token" : "content"}
                        required={!currentQuestion}
                        maxLength={currentQuestion ? 1 : 1024}
                        className="mt-1 p-2 block w-full outline-none focus:border-indigo-500 sm:text-sm"
                        placeholder={
                          currentQuestion
                            ? "Enter ASSISTANT token..."
                            : "Enter USER message... do not enter personal information."
                        }
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </label>
                    <div className="flex justify-between w-full">
                      <p className="text-gray-500">{`${
                        (currentQuestion ? 1 : 1024) - content.length
                      }/${currentQuestion ? 1 : 1024}`}</p>
                      {currentQuestion && (
                        <button
                          type="submit"
                          className={`mt-2 inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white disabled:bg-gray-200 ${
                            content ? "bg-gray-200" : "bg-red-400"
                          }`}
                          disabled={Boolean(voted || content)}
                          tabIndex={content ? -1 : undefined}
                        >
                          EOS
                        </button>
                      )}
                      <button
                        type="submit"
                        className={`mt-2 inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white disabled:bg-gray-200 ${
                          content ? "bg-indigo-600" : "bg-gray-200"
                        } ${content && "hover:bg-indigo-700"}`}
                        disabled={!content || voted}
                      >
                        {currentQuestion ? "Vote" : "Run"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-64 p-4 border-l right-0 bg-gray-100">
              <div className="mb-6 flex flex-col space-y-4">
                <div>
                  <label className="flex justify-between text-sm font-medium text-gray-700">
                    <p>Temperature</p>
                    <p>{temperature.toFixed(2)}</p>
                  </label>
                  <input
                    type="range"
                    name="temperature"
                    min="0"
                    max="2"
                    step="0.01"
                    value={temperature}
                    disabled={!!currentQuestion}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="mt-2 w-full accent-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default QuestionForm;
