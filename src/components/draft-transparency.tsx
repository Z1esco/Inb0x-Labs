import type { ReplyDraft } from "@/types/contracts";

export function DraftTransparency({ draft }: { draft: ReplyDraft }) {
  return (
    <section
      className="draft-transparency"
      aria-label="Reply confidence and evidence"
    >
      <p>
        <strong>Confidence</strong> · {Math.round(draft.confidence * 100)}% ·
        review before copying
      </p>
      {draft.usedFacts.length > 0 && (
        <div>
          <strong>Facts used</strong>
          <ul>
            {draft.usedFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <strong>Uncertainty</strong>
        {draft.uncertainPoints.length ? (
          <ul>
            {draft.uncertainPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : (
          <p>
            No uncertainty was reported by the model. Verify the source
            yourself.
          </p>
        )}
      </div>
      {draft.evidence.length > 0 && (
        <div>
          <strong>Source evidence</strong>
          {draft.evidence.map((item, index) => (
            <blockquote key={`${item.sourceMessageId}-${index}`}>
              <strong>{item.claim}</strong>
              <p>“{item.excerpt}”</p>
              <a
                className="evidence-source"
                href={`/inbox/${encodeURIComponent(draft.threadId)}#${encodeURIComponent(`message-${item.sourceMessageId}`)}`}
              >
                View source message
              </a>
            </blockquote>
          ))}
        </div>
      )}
    </section>
  );
}
