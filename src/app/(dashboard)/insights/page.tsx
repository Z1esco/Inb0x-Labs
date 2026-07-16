import { getDashboardSummary } from "@/server/services/demo-store";
export default function InsightsPage() {
  const insights = getDashboardSummary().insights;
  return (
    <main>
      <div className="shell grid">
        <div>
          <h1>Insights</h1>
          <p className="muted">
            A small, privacy-conscious view of inbox workload.
          </p>
        </div>
        <section className="grid columns">
          {insights.map((item) => (
            <div className="card" key={item.label}>
              <span className="muted">{item.label}</span>
              <h2>
                {item.value}
                {item.unit === "percent" ? "%" : ""}
              </h2>
              <span className="tag">trend: {item.trend}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
