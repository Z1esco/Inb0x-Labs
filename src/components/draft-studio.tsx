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
    <div className="surface surface-pad">
      <div className="surface-header">
        <div>
          <h2>Reply studio</h2>
          <p>Reviewable plain text. Never sent from Inb0x.</p>
        </div>
        <span className="status-label connected">Copy only</span>
      </div>
      <div className="stack">
        <div className="field">
          <label htmlFor="reply-tone">Tone</label>
          <select
            id="reply-tone"
            className="form-select"
            value={tone}
            onChange={(event) => setTone(event.target.value as ReplyTone)}
          >
            {tones.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="reply-length">Length</label>
          <select
            id="reply-length"
            className="form-select"
            value={length}
            onChange={(event) => setLength(event.target.value as ReplyLength)}
          >
            {lengths.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <button
          className="button primary"
          type="button"
          onClick={() => void generate()}
          disabled={loading}
        >
          {loading ? (
            "Generating..."
          ) : (
            <>
              <Icon name="spark" /> Generate draft
            </>
          )}
        </button>
        {error && (
          <div className="danger-box" role="alert">
            <Icon name="warning" /> {error}
          </div>
        )}
        {draft && (
          <div className="stack">
            <div className="success-box">
              <Icon name="check" /> Draft ready for human review.
            </div>
            <div className="surface-deep surface-pad">
              <p className="eyebrow">Subject</p>
              <strong>{draft.subject}</strong>
              <p className="eyebrow" style={{ marginTop: 24 }}>
                Body
              </p>
              <p className="message-body">{draft.body}</p>
            </div>
            {draft.warnings.length > 0 && (
              <div className="warning-box">
                <strong>Review before copying</strong>
                <ul>
                  {draft.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="button secondary"
              type="button"
              onClick={() => void copyDraft()}
            >
              <Icon name="copy" />{" "}
              {copied ? "Copied to clipboard" : "Copy reply"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
