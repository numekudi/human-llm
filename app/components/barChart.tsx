import type { TokenCounts } from "~/routes/questions/votes/sse";

type Props = {
  data: TokenCounts;
};

const BarChart = ({ data }: Props) => {
  const total = data.tokenFreq.reduce((sum, item) => sum + item.count, 0);

  // countが多い順にソート
  const sortedTokenFreq = [...data.tokenFreq].sort((a, b) => b.count - a.count);

  return (
    <div className="w-full p-5 overflow-y-scroll h-64">
      <div className=" p-4">
        {sortedTokenFreq.map(({ token, count }) => {
          const percentage = ((count / total) * 100).toFixed(2);

          return (
            <div key={token} className="flex items-center mb-3">
              <span className="w-24 font-bold">
                {token === "" ? "EOS" : token}
              </span>
              <div
                className="bg-blue-500 h-5 mr-3"
                style={{ width: `${percentage}%` }}
              ></div>
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
