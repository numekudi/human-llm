type Props = {
  value: number;
};

const CountDown = ({ value }: Props) => {
  return (
    <div className="flex flex-col items-center  bg-gray-100 py-4">
      <h1 className="text-xl md:text-4xl font-bold text-gray-800">
        <span className="inline-block w-[5ch] text-right pr-4">
          {(value / 1000).toFixed(1)}
        </span>
        seconds until close
      </h1>
    </div>
  );
};

export default CountDown;
