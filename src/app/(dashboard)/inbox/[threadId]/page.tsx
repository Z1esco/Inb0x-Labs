import { notFound } from "next/navigation";
import { DraftStudio } from "@/components/draft-studio";
import { getDemoThread } from "@/server/services/demo-store";
export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = getDemoThread(threadId);
  if (!thread) notFound();
  return (
    <main>
      <div className="shell grid two-columns">
        <section className="grid">
          <div>
            <span className="tag">{thread.analysis?.category}</span>
            <h1>{thread.subject}</h1>
            <p className="muted">{thread.participants.join(" • ")}</p>
          </div>
          <div className="card">
            {thread.messages.map((message) => (
              <article key={message.id}>
                <strong>{message.from}</strong>
                <p>{message.body}</p>
              </article>
            ))}
          </div>
        </section>
        <aside className="grid">
          <div className="card">
            <h2>Analysis</h2>
            <p>{thread.analysis?.summary}</p>
            <strong>Action items</strong>
            {thread.analysis?.actionItems.length ? (
              <ul>
                {thread.analysis.actionItems.map((item) => (
                  <li key={`${item.sourceMessageId}:${item.title}`}>
                    {item.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No action items detected.</p>
            )}
            {thread.analysis?.safetyFlags.map((flag) => (
              <span className="tag" key={flag}>
                {flag}
              </span>
            ))}
          </div>
          <DraftStudio threadId={thread.id} />
        </aside>
      </div>
    </main>
  );
}
