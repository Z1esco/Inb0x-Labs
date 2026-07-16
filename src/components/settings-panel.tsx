"use client";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
export function SettingsPanel({ demo }: { demo: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  async function reset() {
    try {
      await apiClient.resetDemo();
      setMessage("Demo data reset.");
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Reset failed");
    }
  }
  return (
    <div className="grid">
      <div className="card">
        <h2>Gmail connection</h2>
        <p className="muted">
          {demo
            ? "Disabled in demo mode. Switch to real mode to connect Gmail read-only."
            : "Connect Gmail with read-only authorization."}
        </p>
        {!demo && (
          <a className="button" href="/api/gmail/connect">
            Connect Gmail read-only
          </a>
        )}
      </div>
      <div className="card">
        <h2>Demo data</h2>
        <p className="muted">
          Restore fictional threads, tasks, and settings to their original
          state.
        </p>
        <button className="button secondary" onClick={reset} disabled={!demo}>
          Reset demo
        </button>
        {message && <p role="status">{message}</p>}
      </div>
      <div className="card">
        <h2>Privacy</h2>
        <p>
          Disconnecting Gmail removes stored provider tokens immediately.
          Deleting data requires the exact confirmation phrase through the API.
        </p>
      </div>
    </div>
  );
}
