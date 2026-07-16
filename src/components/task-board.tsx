"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  PriorityLabel,
  Surface,
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
    <div className="stack">
      <Surface>
        <div className="control-row">
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 220 }}
            aria-label="Task title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void createTask();
            }}
            placeholder="Add a task you choose to own"
          />
          <button
            className="button primary"
            type="button"
            onClick={() => void createTask()}
          >
            <Icon name="plus" /> Create task
          </button>
        </div>
      </Surface>
      {error && <ErrorState message={error} />}
      {!error && (
        <Surface>
          <div className="control-row" style={{ marginBottom: 20 }}>
            <div className="segmented-control" style={{ minWidth: 250 }}>
              <button
                type="button"
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                aria-pressed={filter === "open"}
                onClick={() => setFilter("open")}
              >
                Open
              </button>
              <button
                type="button"
                aria-pressed={filter === "completed"}
                onClick={() => setFilter("completed")}
              >
                Done
              </button>
            </div>
            <select
              className="form-select"
              style={{ width: 150 }}
              aria-label="Filter by priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as "all" | TaskPriority)
              }
            >
              <option value="all">All priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          {visible.length ? (
            <div className="task-list">
              {visible.map((task) => (
                <div className="task-row" key={task.id}>
                  <button
                    className="icon-button"
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
                  <span className="list-copy">
                    {editing === task.id ? (
                      <input
                        className="form-input"
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
                        <strong
                          style={{
                            textDecoration:
                              task.status === "completed"
                                ? "line-through"
                                : undefined,
                            color:
                              task.status === "completed"
                                ? "var(--text-muted)"
                                : undefined,
                          }}
                        >
                          {task.title}
                        </strong>
                        <p>
                          {task.source === "manual"
                            ? "Manual task"
                            : "Accepted from email"}{" "}
                          · {formatDate(task.dueAt)}
                        </p>
                      </>
                    )}
                  </span>
                  <PriorityLabel value={task.priority} />
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => {
                      setEditing(task.id);
                      setEditTitle(task.title);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Delete ${task.title}`}
                    onClick={() => void remove(task)}
                  >
                    <Icon name="close" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No tasks in this view"
              message="Accept an action from a thread or create a task manually."
            />
          )}
        </Surface>
      )}
    </div>
  );
}
