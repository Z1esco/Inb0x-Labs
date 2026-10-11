"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";

const steps = [
  "Read the request",
  "See the evidence",
  "Choose the next step",
] as const;

export function EmailWalkthrough() {
  const [step, setStep] = useState(0);
  return (
    <section className="email-walkthrough" aria-label="Email to action example">
      <div
        className="walkthrough-steps"
        role="group"
        aria-label="Follow an email to a decision"
      >
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-pressed={step === index}
            aria-controls="walkthrough-result"
            onClick={() => setStep(index)}
          >
            <span aria-hidden="true">{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <div className="walkthrough-content">
        <div className="walkthrough-source">
          <div className="example-correspondent">
            <span className="example-avatar" aria-hidden="true">
              M
            </span>
            <div>
              <strong>Approval needed: Aurora proposal</strong>
              <span>maya@northstar.demo · Fictional email</span>
            </div>
            <Icon name="inbox" />
          </div>
          <blockquote>
            Please approve the Aurora proposal <mark>by 5:00 PM tomorrow</mark>{" "}
            so procurement can submit it.
          </blockquote>
          <p>Excerpt only · sent date and timezone aren’t shown here.</p>
        </div>
        <div
          id="walkthrough-result"
          className="walkthrough-result"
          aria-live="polite"
        >
          {step === 0 ? (
            <>
              <Icon name="inbox" />
              <h3>A request inside a conversation</h3>
              <p>
                There’s a decision to make and a time attached. Inb0x helps you
                find both without losing the original wording.
              </p>
              <span className="example-boundary">
                Analysis starts when you ask.
              </span>
            </>
          ) : step === 1 ? (
            <>
              <Icon name="search" />
              <h3>Verify the date</h3>
              <p>
                “By 5:00 PM tomorrow” gives a relative deadline. This excerpt
                doesn’t establish the date or timezone. Review the full message
                and confirm both before scheduling the task.
              </p>
              <span className="example-boundary">
                A source excerpt, not a guarantee.
              </span>
            </>
          ) : (
            <>
              <Icon name="tasks" />
              <h3>A suggestion until you accept</h3>
              <p>
                Review and approve the Aurora proposal. This becomes a task only
                after you choose Accept task in the thread.
              </p>
              <Link className="text-action" href="/inbox/proposal-approval">
                Try task acceptance in the demo <Icon name="arrow" />
              </Link>
            </>
          )}
        </div>
      </div>
      <p className="walkthrough-note">
        Illustrative walkthrough from the fictional demo. These controls explain
        the process; they don’t analyze email or create tasks.
      </p>
    </section>
  );
}
