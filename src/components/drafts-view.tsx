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
        if (mounted) {
          setDrafts(items);
          setSelectedDraft(items[0] ?? null);
        }
      })
      .catch(
        (value: unknown) =>
          mounted &&
          setError(
            value instanceof Error ? value.message : "Drafts could not load.",
          ),
      )
      .finally(() => mounted && setLoading(false));
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
      eyebrow="Reply studio · manual copy only"
      title="The writing room"
      description="Grounded reply suggestions held here for review. Inb0x never sends them."
      actions={
        <span className="copy-boundary">
          <Icon name="check" /> Nothing leaves this desk
        </span>
      }
    >
      {loading ? (
        <LoadingGrid />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : drafts.length && selectedDraft ? (
        <div className="writing-room">
          <aside className="draft-index" aria-label="Reply drafts">
            <header>
              <span>Saved replies</span>
              <strong>{drafts.length}</strong>
            </header>
            {drafts.map((draft, index) => (
              <button
                key={draft.id}
                type="button"
                aria-pressed={selectedDraft.id === draft.id}
                onClick={() => {
                  setSelectedDraft(draft);
                  setCopied(false);
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{draft.subject}</strong>
                  <p>
                    {draft.tone} · {draft.length} ·{" "}
                    <RelativeTime value={draft.createdAt} />
                  </p>
                </div>
              </button>
            ))}
          </aside>

          <article className="writing-sheet">
            <header>
              <div>
                <span>Copy-only reply</span>
                <h2>{selectedDraft.subject}</h2>
              </div>
              <strong>
                {Math.round(selectedDraft.confidence * 100)}% grounded
              </strong>
            </header>
            <p className="writing-meta">
              {selectedDraft.tone} tone · {selectedDraft.length} length · human
              review required
            </p>
            <div className="draft-paper">
              <p>{selectedDraft.body}</p>
            </div>
            {selectedDraft.warnings.length > 0 && (
              <aside className="editorial-warning">
                <strong>Review before copying</strong>
                <ul>
                  {selectedDraft.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </aside>
            )}
            <footer>
              <button
                className="desk-button desk-button-ink"
                type="button"
                onClick={() => void copyDraft()}
              >
                <Icon name="copy" />
                {copied ? "Copied to clipboard" : "Copy reply"}
              </button>
              <Link
                className="desk-button desk-button-outline"
                href={`/inbox/${selectedDraft.threadId}`}
              >
                Read source thread
              </Link>
              <button
                className="text-action destructive-text"
                type="button"
                onClick={() => void remove(selectedDraft.id)}
              >
                Delete this draft
              </button>
            </footer>
          </article>
        </div>
      ) : (
        <EmptyState
          title="The writing room is quiet"
          message="Open a priority thread and request a copy-only reply when you need one."
          action={
            <Link className="desk-button desk-button-outline" href="/inbox">
              Open correspondence
            </Link>
          }
        />
      )}
    </PageShell>
  );
}
