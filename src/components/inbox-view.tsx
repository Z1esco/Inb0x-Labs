"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { EmailThreadListItem } from "@/types/contracts";

type InboxFilter = "all" | "reply" | "priority" | "deadline";

export function InboxView() {
  const [threads, setThreads] = useState<EmailThreadListItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("priority");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setThreads(await apiClient.listThreads());
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Inbox could not load.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void apiClient
      .listThreads()
      .then((items) => mounted && setThreads(items))
      .catch(
        (value: unknown) =>
          mounted &&
          setError(
            value instanceof Error ? value.message : "Inbox could not load.",
          ),
      )
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
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
          (filter === "priority" &&
            ["critical", "high"].includes(
              thread.analysis?.priorityLevel ?? "",
            )) ||
          (filter === "deadline" && Boolean(thread.analysis?.deadlines.length));
        return matchesQuery && matchesFilter;
      }),
    [filter, query, threads],
  );

  return (
    <PageShell
      eyebrow="Correspondence · recent and read-only"
      title="The correspondence"
      description="A working index of messages with a decision, deadline, or expected response."
      actions={
        <Link className="desk-button desk-button-outline" href="/settings">
          Connection details
        </Link>
      }
    >
      <section className="correspondence-toolbar">
        <label>
          <Icon name="search" />
          <input
            aria-label="Search inbox"
            placeholder="Search people, subjects, or message text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div role="group" aria-label="Inbox filters">
          {(["priority", "reply", "deadline", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value === "reply"
                ? "Needs reply"
                : value === "all"
                  ? "Everything"
                  : value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="mail-index">
        <header>
          <span>{visible.length} shown</span>
          <span>Sender / Subject</span>
          <span>Signal</span>
          <span>Received</span>
        </header>
        {loading ? (
          <LoadingGrid />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : visible.length ? (
          <ol>
            {visible.map((thread, index) => (
              <li key={thread.id}>
                <Link href={`/inbox/${thread.id}`}>
                  <span className="mail-sequence">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="mail-sender">
                    <strong>
                      {thread.senderNames[0] ??
                        thread.participants[0] ??
                        "Unknown sender"}
                    </strong>
                    <small>
                      {thread.messageCount}{" "}
                      {thread.messageCount === 1 ? "message" : "messages"}
                    </small>
                  </div>
                  <div className="mail-subject">
                    <strong>{thread.subject || "Untitled thread"}</strong>
                    <p>{thread.snippet}</p>
                  </div>
                  <div className="mail-signal">
                    <PriorityLabel
                      value={thread.analysis?.priorityLevel ?? "unscored"}
                    />
                    {thread.analysis?.needsReply && <span>Reply expected</span>}
                    {thread.analysis?.deadlines.length ? (
                      <span>Deadline</span>
                    ) : null}
                  </div>
                  <span className="mail-time">
                    <RelativeTime value={thread.latestMessageAt} />
                  </span>
                  <Icon name="arrow" />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title={
              threads.length
                ? "Nothing matches this view"
                : "No correspondence yet"
            }
            message={
              threads.length
                ? "Change the filter or search wording."
                : "Connect Gmail to build a private, read-only index."
            }
            action={
              !threads.length ? (
                <Link
                  className="desk-button desk-button-outline"
                  href="/settings"
                >
                  Review connection
                </Link>
              ) : undefined
            }
          />
        )}
      </section>
    </PageShell>
  );
}
