import Link from "next/link";
import { getEnvironment } from "@/lib/env";
import { getDashboardSummary } from "@/server/services/demo-store";
export default function DashboardPage() {
  const demo = getEnvironment().DEMO_MODE;
  const summary = demo
    ? getDashboardSummary()
    : {
        totalThreads: 0,
        needsReply: 0,
        urgent: 0,
        openTasks: 0,
        priorityEmails: [],
        insights: [],
      };
  return (
    <main>
      <div className="shell grid">
        <div>
          <span className="tag">{demo ? "Demo data" : "Live workspace"}</span>
          <h1>Today’s inbox focus</h1>
          <p className="muted">Review only what deserves your attention.</p>
        </div>
        <section className="grid columns">
          {[
            ["Threads", summary.totalThreads],
            ["Needs reply", summary.needsReply],
            ["Open tasks", summary.openTasks],
          ].map(([label, value]) => (
            <div className="card" key={label}>
              <div className="muted">{label}</div>
              <strong style={{ fontSize: 34 }}>{value}</strong>
            </div>
          ))}
        </section>
        <section className="card">
          <h2>Priority emails</h2>
          {summary.priorityEmails.length ? (
            summary.priorityEmails.slice(0, 5).map((email) => (
              <p key={email.id}>
                <Link href={`/inbox/${email.id}`}>
                  <strong>{email.subject}</strong>
                </Link>{" "}
                <span className="tag">{email.analysis.priorityLevel}</span>
              </p>
            ))
          ) : (
            <p className="muted">
              No synchronized email yet. Connect Gmail from Settings.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
