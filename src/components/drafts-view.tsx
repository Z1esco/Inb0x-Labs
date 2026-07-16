"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  ErrorState,
  LoadingGrid,
  PageShell,
  RelativeTime,
  Surface,
} from "@/components/page-primitives";
import { apiClient } from "@/lib/api-client";
import type { ReplyDraft } from "@/types/contracts";

export function DraftsView() {
  const [drafts, setDrafts] = useState<ReplyDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void apiClient
      .listDrafts()
      .then(setDrafts)
      .catch((value) =>
        setError(
          value instanceof Error ? value.message : "Drafts could not load.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  async function remove(id: string) {
    try {
      await apiClient.deleteDraft(id);
      setDrafts((items) => items.filter((item) => item.id !== id));
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Draft could not be deleted.",
      );
    }
  }
  return (
    <PageShell
      eyebrow="Signal room / reply studio"
      title="Drafts"
      description="Grounded plain-text suggestions for manual review and copying."
      actions={
        <span className="status-label connected">
          <Icon name="check" /> Nothing is sent
        </span>
      }
    >
      {loading ? (
        <LoadingGrid />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <Surface>
          {drafts.length ? (
            <div className="thread-list">
              {drafts.map((draft) => (
                <article className="thread-row" key={draft.id}>
                  <span className="list-leading">
                    <Icon name="copy" />
                  </span>
                  <span className="list-copy">
                    <strong>{draft.subject}</strong>
                    <p>
                      {draft.tone} · {draft.length} ·{" "}
                      <RelativeTime value={draft.createdAt} />
                    </p>
                  </span>
                  <span className="status-label">
                    {Math.round(draft.confidence * 100)}% confidence
                  </span>
                  <Link
                    className="button secondary"
                    href={`/inbox/${draft.threadId}`}
                  >
                    Review
                  </Link>
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => void remove(draft.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No drafts yet"
              message="Open a priority thread and create a copy-only reply when you are ready."
              action={
                <Link className="button secondary" href="/inbox">
                  Open inbox <Icon name="arrow" />
                </Link>
              }
            />
          )}
        </Surface>
      )}
    </PageShell>
  );
}
