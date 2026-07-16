"use client";

export default function ErrorState({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="page">
      <section className="surface empty-state error-state">
        <h1>Signal interrupted</h1>
        <p>The requested workspace data could not be loaded.</p>
        <button className="button secondary" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
