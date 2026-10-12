"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

const examples = {
  Balanced:
    "Thanks for sharing the proposal. I’ll review it and get back to you before the deadline.",
  Direct:
    "I’ll review the proposal and confirm my decision before the deadline.",
  Warm: "Thanks for putting this together. I’m looking forward to reviewing the proposal and will get back to you before the deadline.",
} as const;

export function ReplyExample() {
  const [tone, setTone] = useState<keyof typeof examples>("Balanced");
  return (
    <div className="reply-example">
      <div className="reply-example-header">
        <Icon name="copy" />
        <strong>Reply Studio</strong>
        <span>Illustrative draft</span>
      </div>
      <div
        className="reply-tone-control"
        role="group"
        aria-label="Try a reply tone"
      >
        {Object.keys(examples).map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={tone === name}
            onClick={() => setTone(name as keyof typeof examples)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="reply-wording" role="status" aria-live="polite">
        <blockquote key={tone}>{examples[tone]}</blockquote>
      </div>
      <p>Prewritten examples. No AI request is made here.</p>
      <div className="reply-example-footer">
        <span>
          <Icon name="check" /> Copy-only
        </span>
        <span>Nothing sent</span>
      </div>
    </div>
  );
}
