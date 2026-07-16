"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { Task } from "@/types/contracts";
export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void apiClient
      .listTasks()
      .then(setTasks)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Tasks failed to load",
        ),
      );
  }, []);
  async function createTask() {
    if (!title.trim()) return;
    try {
      const task = await apiClient.createTask({ title, priority: "medium" });
      setTasks((items) => [task, ...items]);
      setTitle("");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Task creation failed");
    }
  }
  async function complete(task: Task) {
    try {
      const updated = await apiClient.updateTask(task.id, {
        status: task.status === "completed" ? "open" : "completed",
      });
      setTasks((items) =>
        items.map((item) => (item.id === task.id ? updated : item)),
      );
    } catch (value) {
      setError(value instanceof Error ? value.message : "Task update failed");
    }
  }
  return (
    <div className="grid">
      <div className="card" style={{ display: "flex", gap: 10 }}>
        <input
          aria-label="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task"
          style={{ flex: 1 }}
        />
        <button className="button" onClick={createTask}>
          Create task
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="card">
        {tasks.length ? (
          tasks.map((task) => (
            <label
              key={task.id}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <input
                type="checkbox"
                checked={task.status === "completed"}
                onChange={() => void complete(task)}
              />
              <span>
                <strong>{task.title}</strong>
                <br />
                <small className="muted">{task.priority} priority</small>
              </span>
            </label>
          ))
        ) : (
          <p className="muted">No tasks yet.</p>
        )}
      </div>
    </div>
  );
}
