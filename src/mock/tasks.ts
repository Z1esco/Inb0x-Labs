import { DEMO_ANALYSIS_IDS } from "@/mock/emails";
import type { Task } from "@/types/contracts";

function emailTask(
  id: string,
  threadId: string,
  title: string,
  priority: Task["priority"],
  dueAt: string | null,
  evidence: string,
  threadSubject: string,
): Task {
  const createdAt = "2026-07-16T08:30:00.000Z";
  return {
    id,
    threadId,
    analysisId: DEMO_ANALYSIS_IDS[threadId] ?? null,
    title,
    description: null,
    source: "email_action",
    status: "open",
    priority,
    dueAt,
    completedAt: null,
    sourceEmail: {
      threadId,
      analysisId: DEMO_ANALYSIS_IDS[threadId] ?? null,
      messageId: `${threadId}-message-1`,
      evidence,
      threadSubject,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

export const initialDemoTasks: Task[] = [
  emailTask(
    "task-proposal",
    "proposal-approval",
    "Approve Aurora proposal",
    "critical",
    "2026-07-17T09:00:00.000Z",
    "Please approve the Aurora proposal",
    "Approval needed: Aurora proposal",
  ),
  emailTask(
    "task-interview",
    "interview-schedule",
    "Confirm interview attendance",
    "high",
    "2026-07-18T02:00:00.000Z",
    "Please confirm whether you can attend",
    "Interview schedule confirmation",
  ),
  emailTask(
    "task-invoice",
    "invoice-deadline",
    "Pay invoice before deadline",
    "high",
    "2026-07-19T09:00:00.000Z",
    "Payment is due before the stated deadline",
    "Invoice payment deadline",
  ),
  emailTask(
    "task-meeting",
    "team-meeting",
    "Prepare agenda for team meeting",
    "medium",
    null,
    "Please prepare the agenda before our team meeting",
    "Team planning meeting",
  ),
  emailTask(
    "task-security",
    "security-alert",
    "Review security alert",
    "critical",
    null,
    "Review the sign-in and secure your account if it was not you",
    "New sign-in security alert",
  ),
  emailTask(
    "task-design",
    "design-feedback",
    "Send design feedback",
    "high",
    "2026-07-17T03:00:00.000Z",
    "Please send your feedback on the inbox detail design",
    "Inbox detail design feedback",
  ),
  emailTask(
    "task-renewal",
    "subscription-renewal",
    "Review subscription renewal",
    "medium",
    null,
    "Review the plan before the subscription renews",
    "Subscription renewal notice",
  ),
];
