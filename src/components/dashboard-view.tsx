"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  PageShell,
  PriorityLabel,
  RelativeTime,
} from "@/components/page-primitives";
import { apiClient } from "@/lib/api-client";
import type { DashboardData } from "@/types/contracts";

export function DashboardView({
  initialData,
}: {
  initialData?: DashboardData;
}) {
  const [data, setData] = useState<DashboardData | undefined>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiClient.getDashboard({ timezone: "UTC" }));
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Dashboard could not load.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialData) return;
    let mounted = true;
    void apiClient
      .getDashboard({ timezone: "UTC" })
      .then((value) => mounted && setData(value))
      .catch((value: unknown) => {
        if (mounted)
          setError(
            value instanceof Error
              ? value.message
              : "Dashboard could not load.",
          );
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [initialData]);

  if (loading && !data) {
    return (
      <PageShell
        title="Preparing your brief"
        description="Reading the persisted workspace, not your live mailbox."
      >
        <LoadingGrid />
      </PageShell>
    );
  }

  if (error && !data) {
    return (
      <PageShell title="The brief is unavailable">
        <ErrorState message={error} onRetry={() => void load()} />
      </PageShell>
    );
  }

  if (!data) return null;

  return (
    <PageShell
      eyebrow={
        data.demoMode
          ? "Fictional workspace · Thursday"
          : "Private workspace · Today"
      }
      title="Today, edited."
      description="Three places deserve a decision. The rest of the inbox can wait."
      actions={
        <Link className="desk-button desk-button-ink" href="/inbox">
          Open correspondence <Icon name="arrow" />
        </Link>
      }
    >
      <section className="brief-scoreline" aria-label="Workspace summary">
        <div>
          <strong>{data.today.items.length}</strong>
          <span>for attention now</span>
        </div>
        <div>
          <strong>{data.overview.needsReply}</strong>
          <span>awaiting a reply</span>
        </div>
        <div>
          <strong>{data.overview.openTasks}</strong>
          <span>open tasks</span>
        </div>
        <div>
          <strong>{data.overview.threads - data.today.items.length}</strong>
          <span>threads can wait</span>
        </div>
      </section>

      <div className="briefing-layout">
        <section className="attention-ledger">
          <header className="ledger-heading">
            <div>
              <span>Priority queue</span>
              <h2>What needs you</h2>
            </div>
            <Link href="/inbox">
              Review all {data.overview.threads} threads
            </Link>
          </header>
          {data.today.items.length ? (
            <ol className="attention-list">
              {data.today.items.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={
                      item.threadId
                        ? `/inbox/${item.threadId}`
                        : item.taskId
                          ? "/tasks"
                          : "/drafts"
                    }
                  >
                    <span className="attention-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <small>
                        {item.type === "task"
                          ? "Owned task"
                          : item.type === "thread"
                            ? "Correspondence"
                            : "Signal"}
                      </small>
                      <strong>{item.title}</strong>
                    </div>
                    <RelativeTime value={item.at} />
                    <Icon name="arrow" />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="Nothing urgent"
              message="Your attention queue is clear."
            />
          )}
        </section>

        <aside className="brief-margin">
          <section>
            <span className="margin-label">Inbox condition</span>
            <div className="condition-score">
              <strong>{data.inboxHealth.score}</strong>
              <span>
                / 100
                <br />
                {data.inboxHealth.label.replace("_", " ")}
              </span>
            </div>
            <dl>
              {data.inboxHealth.factors.slice(0, 4).map((factor) => (
                <div key={factor.key}>
                  <dt>{factor.label}</dt>
                  <dd>{factor.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <span className="margin-label">Usage today</span>
            <dl>
              <div>
                <dt>Analysis</dt>
                <dd>
                  {data.usage.analysis.used}/{data.usage.analysis.limit}
                </dd>
              </div>
              <div>
                <dt>Reply drafts</dt>
                <dd>
                  {data.usage.replies.used}/{data.usage.replies.limit}
                </dd>
              </div>
            </dl>
            <p>No background analysis. Cache hits do not count.</p>
          </section>
        </aside>
      </div>

      <section className="desk-chapter">
        <header className="ledger-heading">
          <div>
            <span>Correspondence</span>
            <h2>Priority threads</h2>
          </div>
          <Link href="/inbox">Go to the inbox</Link>
        </header>
        <div className="correspondence-ledger">
          {data.priorityThreads.map((thread, index) => (
            <Link key={thread.threadId} href={`/inbox/${thread.threadId}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{thread.subject}</strong>
                <p>
                  {thread.sender ?? "Unknown sender"} · {thread.snippet}
                </p>
              </div>
              <PriorityLabel value={thread.priority} />
              <RelativeTime value={thread.latestMessageAt} />
            </Link>
          ))}
        </div>
      </section>

      <div className="desk-two-column">
        <section className="desk-chapter">
          <header className="ledger-heading">
            <div>
              <span>Work owned</span>
              <h2>Upcoming tasks</h2>
            </div>
            <Link href="/tasks">Manage tasks</Link>
          </header>
          <div className="simple-ledger">
            {data.tasks.upcoming.map((task) => (
              <Link href="/tasks" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <p>
                    {task.dueAt
                      ? `Due ${new Date(task.dueAt).toLocaleDateString("en-US")}`
                      : "No due date"}
                  </p>
                </div>
                <PriorityLabel value={task.priority} />
              </Link>
            ))}
          </div>
        </section>

        <section className="desk-chapter signal-pattern">
          <header className="ledger-heading">
            <div>
              <span>Seven-day pattern</span>
              <h2>Volume, in context</h2>
            </div>
            <Link href="/insights">Read patterns</Link>
          </header>
          <div className="line-bars" aria-label="Seven-day thread volume">
            {data.analytics.weeklyThreads.map((point) => (
              <div key={point.date}>
                <strong>{point.count}</strong>
                <i style={{ height: `${Math.max(12, point.count * 7)}px` }} />
                <small>{point.date.slice(-2)}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
