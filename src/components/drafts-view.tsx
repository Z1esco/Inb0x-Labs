"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  const [selectedDraft, setSelectedDraft] = useState<ReplyDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await apiClient.listDrafts();
      setDrafts(items);
      setSelectedDraft(items[0] ?? null);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Drafts could not load.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    void apiClient
      .listDrafts()
      .then((items) => {
        if (!mounted) return;
        setDrafts(items);
        setSelectedDraft(items[0] ?? null);
      })
      .catch((value: unknown) => {
        if (mounted)
          setError(
            value instanceof Error ? value.message : "Drafts could not load.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function remove(id: string) {
    try {
      await apiClient.deleteDraft(id);
      setDrafts((items) => {
        const remaining = items.filter((item) => item.id !== id);
        if (selectedDraft?.id === id) setSelectedDraft(remaining[0] ?? null);
        return remaining;
      });
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Draft could not be deleted.",
      );
    }
  }

  async function copyDraft() {
    if (!selectedDraft) return;
    try {
      await navigator.clipboard.writeText(
        `${selectedDraft.subject}\n\n${selectedDraft.body}`,
      );
      setCopied(true);
    } catch {
      setError("Copy is unavailable in this browser.");
    }
  }

  return (
    <PageShell
      eyebrow="Signal room / reply studio"
      title="Reply studio"
      description="Grounded, plain-text suggestions for your review and manual copy."
      actions={
        <span className="status-label connected">
          <Icon name="check" /> Nothing is sent
        </span>
      }
    >
      {loading ? (
        <LoadingGrid />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <Surface className="drafts-surface">
          {drafts.length && selectedDraft ? (
            <div className="drafts-layout">
              <div className="draft-list" aria-label="Reply drafts">
                {drafts.map((draft) => (
                  <button
                    className="draft-list-item"
                    type="button"
                    key={draft.id}
                    aria-pressed={selectedDraft.id === draft.id}
                    onClick={() => {
                      setSelectedDraft(draft);
                      setCopied(false);
                    }}
                  >
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
                      {Math.round(draft.confidence * 100)}%
                    </span>
                  </button>
                ))}
              </div>
              <article className="draft-detail">
                <div className="surface-header">
                  <div>
                    <p className="eyebrow">Copy-only reply</p>
                    <h2>{selectedDraft.subject}</h2>
                  </div>
                  <span className="status-label connected">
                    Review required
                  </span>
                </div>
                <p className="draft-meta">
                  {selectedDraft.tone} tone · {selectedDraft.length} length ·{" "}
                  {Math.round(selectedDraft.confidence * 100)}% grounded
                  confidence
                </p>
                <p className="message-body">{selectedDraft.body}</p>
                {selectedDraft.warnings.length > 0 && (
                  <div className="warning-box">
                    <strong>Review before copying</strong>
                    <ul>
                      {selectedDraft.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="draft-actions">
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => void copyDraft()}
                  >
                    <Icon name="copy" />
                    {copied ? "Copied to clipboard" : "Copy draft"}
                  </button>
                  <Link
                    className="button secondary"
                    href={`/inbox/${selectedDraft.threadId}`}
                  >
                    Review thread <Icon name="arrow" />
                  </Link>
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => void remove(selectedDraft.id)}
                  >
                    Delete draft
                  </button>
                </div>
              </article>
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
