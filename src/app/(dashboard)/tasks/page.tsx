import { TaskBoard } from "@/components/task-board";
import { PageShell } from "@/components/page-primitives";
export default function TasksPage() {
  return (
    <PageShell
      eyebrow="Signal room / tasks"
      title="Task sequence"
      description="Work you explicitly chose to own, arranged around the next deadline and source context."
    >
      <TaskBoard />
    </PageShell>
  );
}
