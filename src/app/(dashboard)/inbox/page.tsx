import Link from "next/link";
import { getEnvironment } from "@/lib/env";
import { listDemoThreads } from "@/server/services/demo-store";
export default function InboxPage() {
  const threads = getEnvironment().DEMO_MODE ? listDemoThreads() : [];
  return (
    <main>
      <div className="shell grid">
        <div>
          <h1>Inbox</h1>
          <p className="muted">Recent read-only Gmail threads.</p>
        </div>
        <div className="card">
          {threads.length ? (
            threads.map((thread) => (
              <div
                key={thread.id}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <Link href={`/inbox/${thread.id}`}>
                  <strong>{thread.subject}</strong>
                </Link>
                <p className="muted">{thread.snippet}</p>
                <span className="tag">
                  {thread.analysis?.priorityLevel ?? "not analyzed"}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">
              No threads yet. Connect and synchronize Gmail.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
