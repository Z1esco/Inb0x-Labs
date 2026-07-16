import type { Task } from "@/types/contracts";

export const initialDemoTasks: Task[] = [
  {
    id: "task-proposal",
    threadId: "proposal-approval",
    title: "Approve Aurora proposal",
    description: "Review the final commercial terms.",
    source: "email",
    status: "open",
    priority: "critical",
    dueAt: "2026-07-17T09:00:00.000Z",
    completedAt: null,
    createdAt: "2026-07-16T08:16:00.000Z",
  },
  {
    id: "task-design",
    threadId: "design-feedback",
    title: "Apply inbox detail feedback",
    description: null,
    source: "email",
    status: "in_progress",
    priority: "high",
    dueAt: "2026-07-17T03:00:00.000Z",
    completedAt: null,
    createdAt: "2026-07-14T12:15:00.000Z",
  },
];
