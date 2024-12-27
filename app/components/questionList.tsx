import { useState, useEffect, useRef } from "react";
import type { Question } from "@prisma/client";
import {
  IoChevronForwardSharp,
  IoCreateOutline,
  IoReload,
} from "react-icons/io5";
import { Link, useFetcher, useLocation, useNavigate } from "react-router";
import type { loader } from "~/routes/home";

type Props = {
  initialQuestions: Question[];
  firstCursor: string | null;
};

export function QuestionList({ initialQuestions, firstCursor }: Props) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [nextCursor, setNextCursor] = useState<string | null>(firstCursor);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const fetcher = useFetcher<typeof loader>();
  const scrollContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (fetcher.data) {
      setQuestions((prev) =>
        fetcher.data ? [...prev, ...fetcher.data.questions] : prev
      );
      setNextCursor(fetcher.data.nextCursor);
    }
  }, [fetcher.data]);

  const loadMore = () => {
    if (fetcher.state === "idle" && nextCursor) {
      fetcher.load(`/questions?cursor=` + nextCursor);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container || fetcher.state !== "idle" || !nextCursor) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMore();
      }
    };

    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [nextCursor, fetcher.state]);

  return (
    <>
      {!isPanelOpen && (
        <button
          className="fixed top-4 z-50 p-2  md:hidden border"
          onClick={() => setIsPanelOpen((prev) => !prev)}
        >
          <IoChevronForwardSharp />
        </button>
      )}
      <div
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-gray-100 ${
          isPanelOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col p-2 h-full">
          <div className="flex pb-2 justify-between items-center">
            <div className="font-bold text-2xl">Questions</div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  navigate(location.pathname + location.search, {
                    replace: true,
                  });
                  setQuestions(initialQuestions);
                  setNextCursor(firstCursor);
                }}
              >
                <IoReload size={28} />
              </button>
              <button onClick={() => navigate(".")}>
                <IoCreateOutline size={28} />
              </button>
            </div>
          </div>

          <ul
            ref={scrollContainerRef}
            className="w-full h-full px-2 overflow-y-scroll"
          >
            {questions.map((question) => (
              <Link
                to={`/?questionId=${question.id}`}
                key={question.id}
                onClick={() => setIsPanelOpen(false)}
              >
                <div className="block rounded-md p-2 hover:bg-gray-200">
                  <li className="text-ellipsis overflow-hidden whitespace-nowrap w-full">
                    {question.content}
                  </li>
                </div>
              </Link>
            ))}
          </ul>
          {fetcher.state === "loading" && <p>Loading...</p>}
          {!nextCursor && <p>No more questions to load.</p>}
        </div>
      </div>

      {/* 背景クリックで閉じる */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsPanelOpen(false)}
        ></div>
      )}
    </>
  );
}
