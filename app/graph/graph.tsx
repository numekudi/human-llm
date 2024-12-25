import BarChart from "~/components/barChart";
import CountDown from "~/components/counddown";
import type { TokenCounts } from "~/routes/questions/votes/sse";

type Props = {
  deadlineCount: number;
  freq?: TokenCounts;
};

const Graph = ({ deadlineCount, freq }: Props) => {
  return (
    <>
      <CountDown value={deadlineCount} />
      {freq && <BarChart data={freq} />}
    </>
  );
};
export default Graph;
