import { TaskBoard } from "@/components/task-board";
import { PageShell } from "@/components/page-primitives";
export default function TasksPage() {
  return (
    <PageShell
      eyebrow="Signal room / tasks"
      title="Tasks"
      description="Work you explicitly chose to own, with the source context kept close."
    >
      <TaskBoard />
    </PageShell>
  );
}
