"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ErrorState,
  LoadingGrid,
  PageShell,
} from "@/components/page-primitives";
import { apiClient } from "@/lib/api-client";
import type { DashboardData } from "@/types/contracts";

export function InsightsView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await apiClient.getDashboard({ timezone: "UTC" }));
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Insights could not load.",
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void apiClient
      .getDashboard({ timezone: "UTC" })
      .then((value) => mounted && setData(value))
      .catch(
        (value: unknown) =>
          mounted &&
          setError(
            value instanceof Error ? value.message : "Insights could not load.",
          ),
      );
    return () => {
      mounted = false;
    };
  }, []);

  if (error)
    return (
      <PageShell title="Patterns unavailable">
        <ErrorState message={error} onRetry={() => void load()} />
      </PageShell>
    );
  if (!data)
    return (
      <PageShell title="Reading the pattern">
        <LoadingGrid />
      </PageShell>
    );

  const max = Math.max(
    1,
    ...data.analytics.weeklyThreads.map((item) => item.count),
  );
  return (
    <PageShell
      eyebrow="Measured patterns · persisted workspace only"
      title="Patterns, not scores."
      description="A transparent reading of what entered the desk and what you chose to resolve."
    >
      <section className="insight-opening">
        <div>
          <span>The clearest reading</span>
          <h2>{data.overview.needsReply} conversations are waiting on you.</h2>
          <p>
            The pressure is concentrated, not universal. Most recent
            correspondence does not require an immediate response.
          </p>
        </div>
        <dl>
          <div>
            <dt>Estimated time reclaimed</dt>
            <dd>
              {data.analytics.estimatedTimeSavedMinutes}
              <small>minutes</small>
            </dd>
          </div>
          <div>
            <dt>Grounded confidence</dt>
            <dd>
              {Math.round(data.analytics.averageConfidence * 100)}
              <small>percent</small>
            </dd>
          </div>
          <div>
            <dt>Tasks completed</dt>
            <dd>
              {data.tasks.completed}
              <small>accepted actions</small>
            </dd>
          </div>
        </dl>
      </section>

      <section className="pattern-question">
        <header>
          <span>Question 01</span>
          <h2>When did correspondence arrive?</h2>
          <p>Seven-day normalized thread volume.</p>
        </header>
        <div className="editorial-chart" aria-label="Seven-day thread volume">
          {data.analytics.weeklyThreads.map((point) => (
            <div key={point.date}>
              <span>{point.count}</span>
              <i
                style={{
                  height: `${Math.max(10, (point.count / max) * 100)}%`,
                }}
              />
              <small>{point.date.slice(-2)}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="pattern-columns">
        <section className="pattern-question compact-pattern">
          <header>
            <span>Question 02</span>
            <h2>What competed for attention?</h2>
          </header>
          <ol>
            {data.analytics.categoryDistribution.map((item, index) => (
              <li key={item.key}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.key.replaceAll("_", " ")}</strong>
                <i>
                  <b style={{ width: `${item.percentage}%` }} />
                </i>
                <small>{item.percentage}%</small>
              </li>
            ))}
          </ol>
        </section>
        <section className="pattern-question compact-pattern">
          <header>
            <span>Question 03</span>
            <h2>How urgent was it?</h2>
          </header>
          <ol>
            {data.analytics.priorityDistribution.map((item, index) => (
              <li key={item.key}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.key}</strong>
                <i>
                  <b style={{ width: `${item.percentage}%` }} />
                </i>
                <small>{item.count}</small>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="method-footnote">
        <span>Method note</span>
        <p>
          Time saved is a bounded estimate based on explicit actions. No raw
          email body, reply text, or provider credential is included in this
          page.
        </p>
      </aside>
    </PageShell>
  );
}
