import { TaskBoard } from "@/components/task-board";
export default function TasksPage() {
  return (
    <main>
      <div className="shell grid">
        <div>
          <h1>Tasks</h1>
          <p className="muted">Email actions and tasks you add manually.</p>
        </div>
        <TaskBoard />
      </div>
    </main>
  );
}
