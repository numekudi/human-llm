import {
  type RouteConfig,
  index,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  ...prefix("questions", [
    index("routes/questions/index.tsx"),
    route(":questionId", "routes/questions/question.tsx"),
    ...prefix(":questionId/votes", [
      index("routes/questions/votes/index.tsx"),
      route("sse", "routes/questions/votes/sse.tsx"),
      route(":voteId", "routes/questions/votes/vote.tsx"),
    ]),
    ...prefix(":questionId/answers", [
      index("routes/questions/answers/index.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
