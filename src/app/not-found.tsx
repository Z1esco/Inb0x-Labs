import Link from "next/link";
export default function NotFound() {
  return (
    <main>
      <div className="shell card">
        <h1>Not found</h1>
        <p className="muted">This page or email thread does not exist.</p>
        <Link className="button" href="/dashboard">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
