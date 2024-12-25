import type { Question } from "@prisma/client";
import { IoCreateOutline, IoReload } from "react-icons/io5";
import { Form, Link, useLocation, useNavigate } from "react-router";

type Props = {
  questions?: Question[];
};

export function QuestionList({ questions }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="flex flex-col p-2 bg-gray-100 w-64 h-full">
      <div className="flex pb-2 justify-between ">
        <div className="font-bold text-2xl">Questions</div>
        <div className="flex space-x-2">
          <button
            className=""
            onClick={() => navigate(location.pathname + location.search)}
          >
            <IoReload size={28} />
          </button>
          <button className="" onClick={() => navigate(".")}>
            <IoCreateOutline size={28} />
          </button>
        </div>
      </div>
      <ul className="w-full px-2">
        {questions?.map((question) => (
          <Link to={`/?questionId=${question.id}`} key={question.id}>
            <div className="block rounded-md p-2 hover:bg-gray-200">
              <li className="text-ellipsis overflow-hidden whitespace-nowrap w-full">
                {question.content}
              </li>
            </div>
          </Link>
        ))}
      </ul>
    </div>
  );
}
