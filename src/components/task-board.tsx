"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  PriorityLabel,
} from "@/components/page-primitives";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/ui";
import type { Task, TaskPriority, TaskStatus } from "@/types/contracts";

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiClient
      .listTasks()
      .then(setTasks)
      .catch((value) =>
        setError(
          value instanceof Error ? value.message : "Tasks failed to load.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (filter === "all" || task.status === filter) &&
          (priority === "all" || task.priority === priority),
      ),
    [filter, priority, tasks],
  );

  async function createTask() {
    if (!title.trim()) return;
    try {
      const task = await apiClient.createTask({
        title: title.trim(),
        priority: "medium",
      });
      setTasks((items) => [task, ...items]);
      setTitle("");
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Task creation failed.",
      );
    }
  }

  async function toggle(task: Task) {
    try {
      const updated = await apiClient.updateTask(task.id, {
        status: task.status === "completed" ? "open" : "completed",
      });
      setTasks((items) =>
        items.map((item) => (item.id === task.id ? updated : item)),
      );
    } catch (value) {
      setError(value instanceof Error ? value.message : "Task update failed.");
    }
  }

  async function remove(task: Task) {
    try {
      await apiClient.deleteTask(task.id);
      setTasks((items) => items.filter((item) => item.id !== task.id));
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Task could not be deleted.",
      );
    }
  }

  async function saveTitle(task: Task) {
    if (!editTitle.trim()) return;
    try {
      const updated = await apiClient.updateTask(task.id, {
        title: editTitle.trim(),
      });
      setTasks((items) =>
        items.map((item) => (item.id === task.id ? updated : item)),
      );
      setEditing(null);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Task could not be updated.",
      );
    }
  }

  if (loading) return <LoadingGrid />;

  return (
    <div className="task-workbench">
      <section className="task-capture">
        <span>New task</span>
        <input
          aria-label="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void createTask();
          }}
          placeholder="Write the next action, not the entire project"
        />
        <button type="button" onClick={() => void createTask()}>
          <Icon name="plus" /> Add to the ledger
        </button>
      </section>

      {error && <ErrorState message={error} />}

      <section className="task-ledger">
        <header>
          <div role="group" aria-label="Task status">
            {(["all", "open", "completed"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {value === "completed"
                  ? "Done"
                  : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <select
            aria-label="Filter by priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as "all" | TaskPriority)
            }
          >
            <option value="all">Every priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <span>{visible.length} tasks</span>
        </header>

        {visible.length ? (
          <ol>
            {visible.map((task, index) => (
              <li
                key={task.id}
                className={
                  task.status === "completed" ? "is-complete" : undefined
                }
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <button
                  className="task-check"
                  type="button"
                  aria-label={
                    task.status === "completed"
                      ? `Reopen ${task.title}`
                      : `Complete ${task.title}`
                  }
                  onClick={() => void toggle(task)}
                >
                  <Icon
                    name={task.status === "completed" ? "check" : "clock"}
                  />
                </button>
                <div>
                  {editing === task.id ? (
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void saveTitle(task);
                        if (event.key === "Escape") setEditing(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <strong>{task.title}</strong>
                      <p>
                        {task.source === "manual"
                          ? "Created by you"
                          : "Accepted from correspondence"}{" "}
                        · {formatDate(task.dueAt)}
                      </p>
                    </>
                  )}
                </div>
                <PriorityLabel value={task.priority} />
                <button
                  type="button"
                  onClick={() => {
                    setEditing(task.id);
                    setEditTitle(task.title);
                  }}
                >
                  Edit
                </button>
                <button
                  className="task-delete"
                  type="button"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => void remove(task)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="Nothing in this view"
            message="Accept an action from correspondence or write a task above."
          />
        )}
      </section>
    </div>
  );
}
