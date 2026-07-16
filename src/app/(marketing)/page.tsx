import Link from "next/link";
export default function LandingPage() {
  return (
    <main>
      <div
        className="shell grid"
        style={{ minHeight: "80vh", alignContent: "center", maxWidth: 800 }}
      >
        <span className="tag" style={{ width: "fit-content" }}>
          Apps for Your Life • Hackathon MVP
        </span>
        <h1 style={{ fontSize: "clamp(42px, 8vw, 78px)", margin: 0 }}>
          Your inbox,
          <br />
          turned into action.
        </h1>
        <p className="muted" style={{ fontSize: 20, lineHeight: 1.6 }}>
          Inb0x summarizes long Gmail threads, finds deadlines, extracts tasks,
          and drafts replies—while keeping your mailbox completely read-only.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="button" href="/dashboard">
            Open demo
          </Link>
          <Link className="button secondary" href="/login">
            Sign in
          </Link>
        </div>
        <p className="muted">
          Minimal functional shell. Final interface is owned by the frontend
          partner.
        </p>
      </div>
    </main>
  );
}
