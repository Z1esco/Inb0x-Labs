"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { ReplyDraft } from "@/types/contracts";
export function DraftStudio({ threadId }: { threadId: string }) {
  const [draft, setDraft] = useState<ReplyDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function generate() {
    setLoading(true);
    setError(null);
    try {
      setDraft(
        await apiClient.createDraft({
          threadId,
          tone: "professional",
          length: "short",
        }),
      );
    } catch (value) {
      setError(value instanceof Error ? value.message : "Draft failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="card grid">
      <h2>Reply studio</h2>
      <p className="muted">Draft only—Inb0x cannot send email.</p>
      <button className="button" onClick={generate} disabled={loading}>
        {loading ? "Generating…" : "Generate demo draft"}
      </button>
      {error && <p role="alert">{error}</p>}
      {draft && (
        <>
          <strong>{draft.subject}</strong>
          <pre style={{ whiteSpace: "pre-wrap" }}>{draft.body}</pre>
        </>
      )}
    </div>
  );
}
