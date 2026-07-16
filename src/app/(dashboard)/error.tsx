"use client";
export default function ErrorState({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <div className="shell card">
        <h1>Something went wrong</h1>
        <p className="muted">
          The requested workspace data could not be loaded.
        </p>
        <button className="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
