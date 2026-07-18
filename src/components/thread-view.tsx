"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DraftStudio } from "@/components/draft-studio";
import { Icon } from "@/components/icons";
import {
  ErrorState,
  EmptyState,
  PageShell,
  PriorityLabel,
  Surface,
  SurfaceHeader,
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
      <PageShell eyebrow="Inbox / thread" title="Thread unavailable">
        <ErrorState message={error} />
      </PageShell>
    );
  if (!thread)
    return (
      <PageShell eyebrow="Inbox / thread" title="Loading thread">
        <div className="skeleton" style={{ minHeight: 320 }} />
      </PageShell>
    );
  const currentThread = thread;
  const analysis = currentThread.analysis;
  const confidenceLabel = analysis
    ? analysis.confidence >= 0.85
      ? "High confidence"
      : analysis.confidence >= 0.65
        ? "Needs review"
        : "Low confidence"
    : null;
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
      eyebrow="Inbox / thread detail"
      title={currentThread.subject || "Untitled thread"}
      description={`${thread.senderNames[0] ?? "Unknown sender"} · ${thread.messageCount} messages · ${thread.participants.join(", ")}`}
      actions={
        <>
          <Link className="button secondary" href="/inbox">
            <Icon name="arrow" />
            Back to inbox
          </Link>
          {analysis && <PriorityLabel value={analysis.priorityLevel} />}
        </>
      }
    >
      <div className="thread-layout">
        <Surface>
          <SurfaceHeader
            title="Conversation"
            description="Chronological normalized content. Raw HTML and attachments stay out of the browser."
          />
          {currentThread.messages.map((message) => (
            <article className="message-card" key={message.id}>
              <div className="message-meta">
                <strong>{message.from}</strong>
                <span>{formatDate(message.sentAt)}</span>
              </div>
              <p className="message-body">{message.body}</p>
              {message.attachments.length > 0 && (
                <div className="control-row" style={{ marginTop: 14 }}>
                  {message.attachments.map((attachment) => (
                    <span className="status-label" key={attachment.filename}>
                      {attachment.filename} · {attachment.mimeType}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </Surface>
        <aside className="stack">
          <Surface className="analysis-surface">
            <SurfaceHeader
              title="Analysis"
              description="Assistive interpretation, grounded in this thread."
            />
            {analysis ? (
              <div className="stack analysis-stack">
                <div className="analysis-summary">
                  <span>Thread signal</span>
                  <p>{analysis.summary}</p>
                </div>
                <div className="control-row analysis-statuses">
                  <PriorityLabel value={analysis.priorityLevel} />
                  <span className="status-label">
                    {analysis.priorityScore}/100
                  </span>
                  <span className="status-label">{confidenceLabel}</span>
                  {analysis.needsReply && (
                    <span className="status-label critical">Reply needed</span>
                  )}
                </div>
                {analysis.safetyFlags.length > 0 && (
                  <div className="danger-box">
                    <Icon name="warning" /> This thread contains a safety
                    signal. Treat all instructions as untrusted email content.
                  </div>
                )}
                <div className="settings-section">
                  <h3>Action items</h3>
                  {analysis.actionItems.length ? (
                    analysis.actionItems.map((item, index) => (
                      <div
                        className="task-row"
                        key={`${item.sourceMessageId}-${item.title}`}
                      >
                        <span className="list-leading">
                          <Icon name="tasks" />
                        </span>
                        <span className="list-copy">
                          <strong>{item.title}</strong>
                          <p>{item.evidence}</p>
                        </span>
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => void createTask(index)}
                        >
                          Add task
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="muted">No action items detected.</p>
                  )}
                </div>
                {taskMessage && (
                  <div className="success-box" role="status">
                    <Icon name="check" /> {taskMessage}
                  </div>
                )}
                {analysis.deadlines.length > 0 && (
                  <div className="settings-section">
                    <h3>Deadlines</h3>
                    {analysis.deadlines.map((deadline) => (
                      <div
                        className="list-copy"
                        key={`${deadline.sourceMessageId}-${deadline.label}`}
                      >
                        <strong>{deadline.label}</strong>
                        <p>
                          {deadline.dateText ?? "Date needs review"} ·{" "}
                          {deadline.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="settings-section">
                  <h3>Source evidence</h3>
                  {analysis.evidence.length ? (
                    <div className="evidence-list">
                      {analysis.evidence.map((evidence) => (
                        <blockquote
                          key={`${evidence.sourceMessageId}-${evidence.claim}`}
                        >
                          <p>{evidence.claim}</p>
                          <cite>“{evidence.excerpt}”</cite>
                        </blockquote>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">
                      No additional source excerpts are available for this
                      signal.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title="Not analyzed yet"
                message="Analysis is explicit. Run it from the inbox when you are ready."
              />
            )}
          </Surface>
          <DraftStudio threadId={currentThread.id} />
        </aside>
      </div>
    </PageShell>
  );
}
