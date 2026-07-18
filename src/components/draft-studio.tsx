"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { apiClient } from "@/lib/api-client";
import type { ReplyDraft, ReplyLength, ReplyTone } from "@/types/contracts";

const tones: ReplyTone[] = ["direct", "balanced", "warm", "professional"];
const lengths: ReplyLength[] = ["short", "medium", "detailed"];

export function DraftStudio({ threadId }: { threadId: string }) {
  const [draft, setDraft] = useState<ReplyDraft | null>(null);
  const [tone, setTone] = useState<ReplyTone>("professional");
  const [length, setLength] = useState<ReplyLength>("short");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      setDraft(await apiClient.createDraft({ threadId, tone, length }));
    } catch (value) {
      setError(value instanceof Error ? value.message : "Draft failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);
      setCopied(true);
    } catch {
      setError("Copy is unavailable in this browser.");
    }
  }

  return (
    <section className="thread-writing-studio">
      <header>
        <span>Writing room</span>
        <strong>Copy only</strong>
      </header>
      <h2>Prepare a reply</h2>
      <p>
        Choose the shape of the response. You will review and copy it manually.
      </p>
      <div className="studio-controls">
        <label>
          Tone
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value as ReplyTone)}
          >
            {tones.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Length
          <select
            value={length}
            onChange={(event) => setLength(event.target.value as ReplyLength)}
          >
            {lengths.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        className="desk-button desk-button-ink"
        type="button"
        onClick={() => void generate()}
        disabled={loading}
      >
        {loading ? (
          "Preparing reply…"
        ) : (
          <>
            Prepare reply <Icon name="arrow" />
          </>
        )}
      </button>
      {error && (
        <p className="inline-warning" role="alert">
          <Icon name="warning" />
          {error}
        </p>
      )}
      {draft && (
        <div className="studio-result">
          <p className="inline-confirmation" role="status">
            Draft ready for review.
          </p>
          <span>Subject</span>
          <strong>{draft.subject}</strong>
          <span>Body</span>
          <p>{draft.body}</p>
          {draft.warnings.length > 0 && (
            <aside className="editorial-warning">
              <strong>Review before copying</strong>
              <ul>
                {draft.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </aside>
          )}
          <button
            className="desk-button desk-button-outline"
            type="button"
            onClick={() => void copyDraft()}
          >
            <Icon name="copy" />
            {copied ? "Copied to clipboard" : "Copy reply"}
          </button>
        </div>
      )}
    </section>
  );
}
