import { demoThreads } from "@/mock/emails";

export const demoAnalyses = Object.fromEntries(
  demoThreads.flatMap((thread) =>
    thread.analysis ? [[thread.id, thread.analysis]] : [],
  ),
);
