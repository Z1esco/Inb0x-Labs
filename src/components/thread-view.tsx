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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const sourceThreadId = thread?.id;

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

  useEffect(() => {
    if (!sourceThreadId) return;
    // Real-mode messages arrive after navigation; focus the requested source
    // once it exists, as well as on native same-page fragment navigation.
    function focusSource() {
      let id: string;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (!id.startsWith("message-")) return;
      const source = document.getElementById(id);
      if (!source?.classList.contains("letter")) return;
      source.scrollIntoView({ block: "start" });
      source.focus({ preventScroll: true });
    }
    const frame = requestAnimationFrame(focusSource);
    window.addEventListener("hashchange", focusSource);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", focusSource);
    };
  }, [sourceThreadId]);

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

  function sourceLink(messageId: string) {
    if (!currentThread.messages.some((message) => message.id === messageId))
      return <small>Source message unavailable in this view.</small>;
    return (
      <a
        className="evidence-source"
        href={`#${encodeURIComponent(`message-${messageId}`)}`}
      >
        View source message
      </a>
    );
  }

  async function analyze() {
    setAnalyzing(true);
    setAnalysisMessage(null);
    setAnalysisError(null);
    setTaskMessage(null);
    try {
      const result = await apiClient.analyzeThreadWithMetadata(
        currentThread.id,
      );
      setThread(
        (value) =>
          value && {
            ...value,
            analysis: result.analysis,
            analysisId: result.analysisId,
          },
      );
      setAnalysisMessage(
        result.cached
          ? "Cached analysis ready for review."
          : "Analysis ready for review.",
      );
    } catch (value) {
      setAnalysisError(
        value instanceof Error
          ? value.message
          : "Analysis could not be prepared.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function createTask(actionIndex: number) {
    if (!currentThread.analysisId || accepting) return;
    setAccepting(true);
    setAnalysisMessage(null);
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
    } finally {
      setAccepting(false);
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
            <p>Read-only conversation · attachments are not downloaded.</p>
          </header>
          {currentThread.messages.map((message, index) => (
            <section
              className="letter"
              key={message.id}
              id={`message-${message.id}`}
              tabIndex={-1}
            >
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
                <p className="analysis-prose">{analysis.priorityReason}</p>
                {analysis.replyReason && (
                  <p className="analysis-prose">{analysis.replyReason}</p>
                )}
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
                          {sourceLink(item.sourceMessageId)}
                        </div>
                        <button
                          type="button"
                          disabled={accepting || analyzing}
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
                          <p>
                            {Math.round(deadline.confidence * 100)}% confidence
                            · verify before acting
                          </p>
                          {sourceLink(deadline.sourceMessageId)}
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
                      {sourceLink(evidence.sourceMessageId)}
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
            <div className="analysis-action">
              <button
                className="desk-button desk-button-ink"
                type="button"
                disabled={analyzing || accepting}
                onClick={() => void analyze()}
              >
                {analyzing ? "Analyzing…" : "Analyze thread"}
              </button>
            </div>
            {analysisMessage && (
              <p className="inline-confirmation" role="status">
                {analysisMessage}
              </p>
            )}
            {analysisError && (
              <p className="inline-warning" role="alert">
                {analysisError}
              </p>
            )}
          </section>
          <DraftStudio threadId={currentThread.id} />
        </aside>
      </div>
    </PageShell>
  );
}
