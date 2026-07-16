import Link from "next/link";
export default function NotFound() {
  return (
    <main className="hero-page">
      <section
        className="surface surface-pad"
        style={{ maxWidth: 560, margin: "12vh auto" }}
      >
        <p className="eyebrow">404 / quiet room</p>
        <h1>Nothing here.</h1>
        <p className="muted">
          This page or thread does not exist in the current workspace.
        </p>
        <Link className="button primary" href="/dashboard">
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
