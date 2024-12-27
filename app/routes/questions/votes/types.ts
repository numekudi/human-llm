export type Deadline = {
  type: "deadline";
  deadline: number;
};

export type TokenCounts = {
  type: "counts";
  tokenFreq: {
    token: string;
    count: number;
  }[];
};

export type EventData = Deadline | TokenCounts;
