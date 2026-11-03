import { createFileRoute } from "@tanstack/react-router";

import { BoardPage } from "../fork/board/BoardPage";

export const Route = createFileRoute("/_chat/board")({
  component: BoardPage,
});
