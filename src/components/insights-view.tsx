"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import {
  ErrorState,
  LoadingGrid,
  PageShell,
  Surface,
  SurfaceHeader,
} from "@/components/page-primitives";
import { apiClient } from "@/lib/api-client";
import type { DashboardData } from "@/types/contracts";

export function InsightsView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void apiClient
      .getDashboard({ timezone: "UTC" })
      .then(setData)
      .catch((value) =>
        setError(
          value instanceof Error ? value.message : "Insights could not load.",
        ),
      );
  }, []);
  if (error)
    return (
      <PageShell eyebrow="Signal room / insights" title="Insights">
        <ErrorState message={error} />
      </PageShell>
    );
  if (!data)
    return (
      <PageShell eyebrow="Signal room / insights" title="Insights">
        <LoadingGrid />
      </PageShell>
    );
  const max = Math.max(
    1,
    ...data.analytics.weeklyThreads.map((item) => item.count),
  );
  return (
    <PageShell
      eyebrow="Signal room / insights"
      title="Insights"
      description="Measured patterns from persisted workspace data. Estimates are transparent, not judgments."
    >
      <div className="metric-grid">
        <article className="surface metric-card">
          <div className="metric-label">
            <span>Time saved</span>
            <Icon name="clock" />
          </div>
          <strong>{data.analytics.estimatedTimeSavedMinutes}m</strong>
          <small>Heuristic from explicit analysis, tasks, and drafts</small>
        </article>
        <article className="surface metric-card">
          <div className="metric-label">
            <span>Confidence</span>
            <Icon name="activity" />
          </div>
          <strong>{Math.round(data.analytics.averageConfidence * 100)}%</strong>
          <small>Average validated analysis confidence</small>
        </article>
        <article className="surface metric-card">
          <div className="metric-label">
            <span>Tasks completed</span>
            <Icon name="check" />
          </div>
          <strong>{data.tasks.completed}</strong>
          <small>Accepted work closed by you</small>
        </article>
        <article className="surface metric-card accent">
          <div className="metric-label">
            <span>Reply pressure</span>
            <Icon name="arrow" />
          </div>
          <strong>{data.overview.needsReply}</strong>
          <small>Threads currently asking for a response</small>
        </article>
      </div>
      <div className="data-grid">
        <Surface>
          <SurfaceHeader
            title="Thread volume"
            description="Seven-day normalized thread count."
          />
          <div className="bar-chart">
            {data.analytics.weeklyThreads.map((point) => (
              <div className="bar-column" key={point.date}>
                <span
                  style={{
                    height: `${Math.max(8, (point.count / max) * 100)}%`,
                  }}
                />
                <small>{point.date.slice(-2)}</small>
              </div>
            ))}
          </div>
        </Surface>
        <Surface>
          <SurfaceHeader
            title="Categories"
            description="Supported categories from current analysis."
          />
          <div className="stack">
            {data.analytics.categoryDistribution.map((item) => (
              <div className="setting-line" key={item.key}>
                <div style={{ flex: 1 }}>
                  <strong>{item.key}</strong>
                  <span
                    style={{
                      display: "block",
                      height: 5,
                      marginTop: 8,
                      borderRadius: 3,
                      background: `linear-gradient(90deg, var(--signal-cyan) ${item.percentage}%, var(--surface-3) ${item.percentage}%)`,
                    }}
                  />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </Surface>
        <Surface>
          <SurfaceHeader
            title="Priority mix"
            description="Urgency distribution without a rainbow palette."
          />
          <div className="stack">
            {data.analytics.priorityDistribution.map((item) => (
              <div className="setting-line" key={item.key}>
                <div>
                  <strong>{item.key}</strong>
                  <span>{item.percentage}% of analyzed threads</span>
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </Surface>
        <Surface>
          <SurfaceHeader
            title="Method note"
            description="How to read this page."
          />
          <p className="muted">
            Insights are bounded to the dashboard API window. Time saved is an
            estimate based on explicit actions; it does not claim a guaranteed
            productivity outcome. No raw email, reply body, or provider
            credential is exposed here.
          </p>
          <div className="success-box">
            <Icon name="check" /> Read-only data boundary verified by the
            dashboard contract.
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
