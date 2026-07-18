"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  PageShell,
  PriorityLabel,
  RelativeTime,
  Surface,
  SurfaceHeader,
} from "@/components/page-primitives";
import { apiClient } from "@/lib/api-client";
import type { EmailThreadListItem } from "@/types/contracts";

export function InboxView() {
  const [threads, setThreads] = useState<EmailThreadListItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "reply" | "critical">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void apiClient
      .listThreads()
      .then(setThreads)
      .catch((value) =>
        setError(
          value instanceof Error ? value.message : "Inbox could not load.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const visible = useMemo(
    () =>
      threads.filter((thread) => {
        const haystack =
          `${thread.subject} ${thread.snippet} ${thread.participants.join(" ")}`.toLowerCase();
        const matchesQuery =
          !query.trim() || haystack.includes(query.trim().toLowerCase());
        const matchesFilter =
          filter === "all" ||
          (filter === "reply" && thread.analysis?.needsReply) ||
          (filter === "critical" &&
            ["critical", "high"].includes(
              thread.analysis?.priorityLevel ?? "",
            ));
        return matchesQuery && matchesFilter;
      }),
    [filter, query, threads],
  );
  return (
    <PageShell
      eyebrow="Signal room / inbox"
      title="Inbox"
      description="Scan the threads that need a decision, not every thread in the mailbox."
      actions={
        <Link className="button primary" href="/settings">
          <Icon name="settings" />
          Connection settings
        </Link>
      }
    >
      <Surface className="inbox-workspace">
        <div className="control-row" style={{ marginBottom: 22 }}>
          <div style={{ minWidth: 240, flex: 1, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                color: "var(--text-muted)",
              }}
            >
              <Icon name="search" />
            </span>
            <input
              className="search-field"
              style={{ paddingLeft: 42 }}
              aria-label="Search inbox"
              placeholder="Search subjects, people, and snippets"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div
            className="segmented-control"
            style={{ minWidth: 260 }}
            role="group"
            aria-label="Inbox filters"
          >
            <button
              type="button"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All threads
            </button>
            <button
              type="button"
              aria-pressed={filter === "reply"}
              onClick={() => setFilter("reply")}
            >
              Needs reply
            </button>
            <button
              type="button"
              aria-pressed={filter === "critical"}
              onClick={() => setFilter("critical")}
            >
              Priority
            </button>
          </div>
        </div>
        <SurfaceHeader
          title={`${visible.length} threads`}
          description="Normalized, read-only message data."
        />
        {loading ? (
          <LoadingGrid />
        ) : error ? (
          <ErrorState message={error} />
        ) : visible.length ? (
          <div className="thread-list">
            {visible.map((thread) => (
              <Link
                className="thread-row"
                key={thread.id}
                href={`/inbox/${thread.id}`}
              >
                <span
                  className={`priority-rail ${thread.analysis?.priorityLevel ?? "low"}`}
                />
                <span className="list-copy">
                  <strong>{thread.subject || "Untitled thread"}</strong>
                  <p>
                    {thread.senderNames[0] ??
                      thread.participants[0] ??
                      "Unknown sender"}{" "}
                    · {thread.snippet}
                  </p>
                </span>
                <span className="list-meta">{thread.messageCount} msg</span>
                <span className="thread-signals">
                  {thread.analysis?.needsReply && (
                    <span className="status-label critical">Reply</span>
                  )}
                  <PriorityLabel
                    value={thread.analysis?.priorityLevel ?? "unscored"}
                  />
                  <span className="list-meta">
                    <RelativeTime value={thread.latestMessageAt} />
                  </span>
                  <Icon name="arrow" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              threads.length
                ? "No matching threads"
                : "Your signal room is empty"
            }
            message={
              threads.length
                ? "Try a different search or filter."
                : "Connect and synchronize Gmail to build your read-only inbox."
            }
            action={
              !threads.length ? (
                <Link className="button secondary" href="/settings">
                  Review connection
                </Link>
              ) : undefined
            }
          />
        )}
      </Surface>
    </PageShell>
  );
}
