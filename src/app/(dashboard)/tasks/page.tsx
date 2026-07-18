import { TaskBoard } from "@/components/task-board";
import { PageShell } from "@/components/page-primitives";
export default function TasksPage() {
  return (
    <PageShell
      eyebrow="Owned work · explicit commitments"
      title="The task ledger"
      description="A deliberate record of the work you accepted—not another automated to-do list."
    >
      <TaskBoard />
    </PageShell>
  );
}
