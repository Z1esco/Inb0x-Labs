"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  MetricCard,
  PageShell,
  PriorityLabel,
  RelativeTime,
  Surface,
  SurfaceHeader,
} from "@/components/page-primitives";
import { apiClient } from "@/lib/api-client";
import type { DashboardData } from "@/types/contracts";

function maxValue(values: Array<{ count: number }>) {
  return Math.max(1, ...values.map((item) => item.count));
}

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
      .then((value) => {
        if (mounted) setData(value);
      })
      .catch((value: unknown) => {
        if (mounted)
          setError(
            value instanceof Error
              ? value.message
              : "Dashboard could not load.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [initialData]);
  if (loading && !data)
    return (
      <PageShell
        eyebrow="Signal room"
        title="Inbox focus"
        description="Turning noise into a deliberate action plan."
      >
        <LoadingGrid />
        <div className="dashboard-grid">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </PageShell>
    );
  if (error && !data)
    return (
      <PageShell eyebrow="Signal room" title="Inbox focus">
        <ErrorState message={error} onRetry={() => void load()} />
      </PageShell>
    );
  if (!data) return null;
  const chartMax = maxValue(data.analytics.weeklyThreads);
  return (
    <PageShell
      eyebrow={
        data.demoMode
          ? "Demo workspace / read-only"
          : "Live workspace / read-only"
      }
      title="Inbox focus"
      description="A calm view of what deserves your attention today."
      actions={
        <>
          <Link className="button secondary" href="/inbox">
            <Icon name="inbox" />
            Open inbox
          </Link>
          <Link className="button primary" href="/tasks">
            <Icon name="tasks" />
            Review tasks
          </Link>
        </>
      }
    >
      <div className="metric-grid">
        <MetricCard
          label="Threads"
          value={data.overview.threads}
          detail={`${data.overview.analyzedThreads} analyzed`}
          icon="inbox"
        />
        <MetricCard
          label="Needs reply"
          value={data.overview.needsReply}
          detail="Awaiting a human response"
          icon="arrow"
          accent
        />
        <MetricCard
          label="Open tasks"
          value={data.overview.openTasks}
          detail={`${data.overview.overdueTasks} overdue`}
          icon="tasks"
        />
        <MetricCard
          label="Inbox health"
          value={data.inboxHealth.score}
          detail={data.inboxHealth.label.replace("_", " ")}
          icon="activity"
        />
      </div>
      <div className="dashboard-grid">
        <Surface className="focus-signal">
          <SurfaceHeader
            title="Focus signal"
            description="The next actions with the clearest time pressure."
            action={
              <Link className="button ghost" href="/inbox">
                View all <Icon name="arrow" />
              </Link>
            }
          />
          <div className="focus-signal-summary">
            <div>
              <span>Requires attention</span>
              <strong>{data.today.items.length}</strong>
              <small>
                {data.overview.criticalThreads} critical threads ·{" "}
                {data.overview.needsReply} awaiting a reply
              </small>
            </div>
            <div className="focus-beam" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>
          {data.today.items.length ? (
            <div className="focus-list">
              {data.today.items.map((item) => (
                <Link
                  className="focus-item"
                  key={item.id}
                  href={
                    item.threadId
                      ? `/inbox/${item.threadId}`
                      : item.taskId
                        ? "/tasks"
                        : "/drafts"
                  }
                >
                  <span className="list-leading">
                    {item.type === "task"
                      ? "T"
                      : item.type === "thread"
                        ? "R"
                        : "A"}
                  </span>
                  <span className="list-copy">
                    <strong>{item.title}</strong>
                    <p>
                      {item.type === "task"
                        ? "Task"
                        : item.type === "thread"
                          ? "Priority thread"
                          : "Inbox signal"}
                    </p>
                  </span>
                  <span className="list-meta">
                    <RelativeTime value={item.at} />
                  </span>
                  <Icon name="arrow" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No urgent signals"
              message="Your focus queue is clear. New priority mail will appear here."
            />
          )}
        </Surface>
        <Surface>
          <SurfaceHeader
            title="Inbox health"
            description="Transparent workload triage."
          />
          <div className="health-overview">
            <div className="ring">
              <strong>{data.inboxHealth.score}</strong>
            </div>
            <div className="health-factors">
              {data.inboxHealth.factors.slice(0, 4).map((factor) => (
                <div key={factor.key} className="setting-line">
                  <span>{factor.label}</span>
                  <strong>{factor.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </Surface>
        <Surface>
          <SurfaceHeader
            title="Priority inbox"
            description="Sorted by urgency, deadline, and reply need."
            action={
              <Link className="button ghost" href="/inbox">
                Open inbox <Icon name="arrow" />
              </Link>
            }
          />
          {data.priorityThreads.length ? (
            <div className="priority-list">
              {data.priorityThreads.map((thread) => (
                <Link
                  className="priority-item"
                  key={thread.threadId}
                  href={`/inbox/${thread.threadId}`}
                >
                  <span className={`priority-rail ${thread.priority}`} />
                  <span className="list-copy">
                    <strong>{thread.subject}</strong>
                    <p>
                      {thread.sender ?? "Unknown sender"} · {thread.snippet}
                    </p>
                  </span>
                  <PriorityLabel value={thread.priority} />
                  <span className="list-meta">
                    <RelativeTime value={thread.latestMessageAt} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No priority threads"
              message="Connect and sync Gmail to build your attention queue."
            />
          )}
        </Surface>
        <Surface>
          <SurfaceHeader
            title="Model usage"
            description="Explicit calls only. Cache hits do not count."
          />
          <div className="stack">
            <div className="setting-line">
              <div>
                <strong>Analysis</strong>
                <span>{data.usage.analysis.remaining} remaining today</span>
              </div>
              <strong>
                {data.usage.analysis.used}/{data.usage.analysis.limit}
              </strong>
            </div>
            <div className="setting-line">
              <div>
                <strong>Reply drafts</strong>
                <span>Copy-only generation</span>
              </div>
              <strong>
                {data.usage.replies.used}/{data.usage.replies.limit}
              </strong>
            </div>
            <div className="success-box">
              <Icon name="check" /> Gmail access is read-only. No message is
              sent automatically.
            </div>
          </div>
        </Surface>
        <Surface>
          <SurfaceHeader
            title="Category mix"
            description="What has been competing for attention."
          />
          {data.analytics.categoryDistribution.length ? (
            <div className="category-list">
              {data.analytics.categoryDistribution.map((category) => (
                <div className="category-row" key={category.key}>
                  <span>{category.key.replaceAll("_", " ")}</span>
                  <div aria-hidden="true">
                    <i style={{ width: `${category.percentage}%` }} />
                  </div>
                  <strong>{category.percentage}%</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No category signal yet"
              message="Categories appear after your inbox has been analyzed."
            />
          )}
        </Surface>
        <Surface className="dashboard-wide">
          <SurfaceHeader
            title="Seven-day signal"
            description="Recent volume and accepted work, not a productivity score."
          />
          <div className="bar-chart" aria-label="Seven-day thread volume chart">
            {data.analytics.weeklyThreads.map((point) => (
              <div className="bar-column" key={point.date}>
                <span
                  style={{
                    height: `${Math.max(8, (point.count / chartMax) * 100)}%`,
                  }}
                />
                <small>{point.date.slice(-2)}</small>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Threads received
            </span>
            <span>
              <i className="cyan" />
              Normalized signal
            </span>
          </div>
        </Surface>
        <Surface>
          <SurfaceHeader
            title="Upcoming tasks"
            action={
              <Link className="button ghost" href="/tasks">
                Tasks <Icon name="arrow" />
              </Link>
            }
          />
          {data.tasks.upcoming.length ? (
            <div className="task-list">
              {data.tasks.upcoming.map((task) => (
                <Link className="task-row" key={task.id} href="/tasks">
                  <span className={`priority-rail ${task.priority}`} />
                  <span className="list-copy">
                    <strong>{task.title}</strong>
                    <p>
                      {task.dueAt
                        ? `Due ${new Date(task.dueAt).toLocaleDateString("en-US")}`
                        : "No due date"}
                    </p>
                  </span>
                  <PriorityLabel value={task.priority} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming tasks"
              message="Accepted email actions and manual tasks will appear here."
            />
          )}
        </Surface>
        <Surface>
          <SurfaceHeader title="Recent activity" />
          <div className="activity-list">
            {data.recentActivity.length ? (
              data.recentActivity.slice(0, 5).map((item) => (
                <div className="activity-item" key={item.id}>
                  <span className="list-leading">
                    <Icon
                      name={
                        item.type === "task_completed" ? "check" : "activity"
                      }
                    />
                  </span>
                  <span className="list-copy">
                    <strong>{item.title}</strong>
                    <p>{item.type.replaceAll("_", " ")}</p>
                  </span>
                  <span className="list-meta">
                    <RelativeTime value={item.at} />
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">No activity recorded yet.</p>
            )}
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
