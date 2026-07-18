"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DraftStudio } from "@/components/draft-studio";
import { Icon } from "@/components/icons";
import {
  EmptyState,
  ErrorState,
  PageShell,
  PriorityLabel,
} from "@/components/page-primitives";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/ui";
import type { EmailThreadDetail } from "@/types/contracts";

export function ThreadView({
  threadId,
  initialThread,
}: {
  threadId: string;
  initialThread?: EmailThreadDetail;
}) {
  const [thread, setThread] = useState<EmailThreadDetail | undefined>(
    initialThread,
  );
  const [error, setError] = useState<string | null>(null);
  const [taskMessage, setTaskMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialThread)
      void apiClient
        .getThread(threadId)
        .then(setThread)
        .catch((value) =>
          setError(
            value instanceof Error ? value.message : "Thread could not load.",
          ),
        );
  }, [initialThread, threadId]);

  if (error)
    return (
      <PageShell title="Thread unavailable">
        <ErrorState message={error} />
      </PageShell>
    );
  if (!thread)
    return (
      <PageShell title="Opening correspondence">
        <div className="loading-letter" />
      </PageShell>
    );

  const currentThread = thread;
  const analysis = currentThread.analysis;

  async function createTask(actionIndex: number) {
    if (!currentThread.analysisId) return;
    setTaskMessage(null);
    try {
      const result = await apiClient.createTaskFromAnalysis({
        analysisId: currentThread.analysisId,
        actionIndex,
      });
      setTaskMessage(
        result.duplicate
          ? "That action is already in Tasks."
          : "Action added to Tasks.",
      );
    } catch (value) {
      setTaskMessage(
        value instanceof Error ? value.message : "Task could not be created.",
      );
    }
  }

  return (
    <PageShell
      eyebrow={`Correspondence · ${currentThread.messageCount} ${currentThread.messageCount === 1 ? "message" : "messages"}`}
      title={currentThread.subject || "Untitled thread"}
      description={`${currentThread.senderNames[0] ?? "Unknown sender"} · ${currentThread.participants.join(", ")}`}
      actions={
        <Link className="desk-button desk-button-outline" href="/inbox">
          <Icon name="arrow" /> Back to index
        </Link>
      }
    >
      <div className="reading-desk">
        <article className="letter-stack">
          <header className="reading-heading">
            <span>Conversation</span>
            <p>Normalized plain text. Source HTML never enters this view.</p>
          </header>
          {currentThread.messages.map((message, index) => (
            <section className="letter" key={message.id}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{message.from}</strong>
                  <small>{formatDate(message.sentAt)}</small>
                </div>
              </header>
              <p>{message.body}</p>
              {message.attachments.length > 0 && (
                <ul className="attachment-list">
                  {message.attachments.map((attachment) => (
                    <li key={attachment.filename}>
                      {attachment.filename}
                      <small>{attachment.mimeType}</small>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <aside className="intelligence-margin">
          <section className="analysis-note">
            <header>
              <span>Intelligence note</span>
              {analysis && <PriorityLabel value={analysis.priorityLevel} />}
            </header>
            {analysis ? (
              <>
                <h2>What this thread means</h2>
                <p className="analysis-prose">{analysis.summary}</p>
                <dl className="analysis-facts">
                  <div>
                    <dt>Priority</dt>
                    <dd>{analysis.priorityScore}/100</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{Math.round(analysis.confidence * 100)}%</dd>
                  </div>
                  <div>
                    <dt>Response</dt>
                    <dd>{analysis.needsReply ? "Expected" : "Not expected"}</dd>
                  </div>
                </dl>
                {analysis.safetyFlags.length > 0 && (
                  <div className="inline-warning">
                    <Icon name="warning" />
                    Untrusted instructions detected. Review carefully.
                  </div>
                )}
                <section className="note-section">
                  <h3>Proposed actions</h3>
                  {analysis.actionItems.length ? (
                    analysis.actionItems.map((item, index) => (
                      <article key={`${item.sourceMessageId}-${item.title}`}>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.evidence}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void createTask(index)}
                        >
                          Accept task
                        </button>
                      </article>
                    ))
                  ) : (
                    <p>No action items detected.</p>
                  )}
                </section>
                {taskMessage && (
                  <p className="inline-confirmation" role="status">
                    {taskMessage}
                  </p>
                )}
                {analysis.deadlines.length > 0 && (
                  <section className="note-section">
                    <h3>Dates to verify</h3>
                    {analysis.deadlines.map((deadline) => (
                      <article
                        key={`${deadline.sourceMessageId}-${deadline.label}`}
                      >
                        <div>
                          <strong>{deadline.label}</strong>
                          <p>
                            {deadline.dateText ?? "Date needs review"} ·{" "}
                            {deadline.evidence}
                          </p>
                        </div>
                      </article>
                    ))}
                  </section>
                )}
                <section className="note-section evidence-notes">
                  <h3>Source evidence</h3>
                  {analysis.evidence.map((evidence) => (
                    <blockquote
                      key={`${evidence.sourceMessageId}-${evidence.claim}`}
                    >
                      <strong>{evidence.claim}</strong>
                      <p>“{evidence.excerpt}”</p>
                    </blockquote>
                  ))}
                </section>
              </>
            ) : (
              <EmptyState
                title="Not analyzed"
                message="Analysis begins only when you explicitly request it."
              />
            )}
          </section>
          <DraftStudio threadId={currentThread.id} />
        </aside>
      </div>
    </PageShell>
  );
}
