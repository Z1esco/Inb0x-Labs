"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { apiClient } from "@/lib/api-client";
import type { ReplyLength, ReplyTone, UserSettings } from "@/types/contracts";

export function SettingsPanel({ demo }: { demo: boolean }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [tone, setTone] = useState<ReplyTone>("balanced");
  const [length, setLength] = useState<ReplyLength>("medium");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void apiClient
      .getSettings()
      .then((value) => {
        setSettings(value);
        setTone(value.preferredTone);
        setLength(value.preferredReplyLength);
      })
      .catch((value) =>
        setError(
          value instanceof Error ? value.message : "Settings could not load.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  async function save(input: Partial<UserSettings>) {
    setMessage(null);
    setError(null);
    try {
      const next = await apiClient.updateSettings(input);
      setSettings(next);
      setTone(next.preferredTone);
      setLength(next.preferredReplyLength);
      setMessage("Preferences saved.");
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Preferences could not save.",
      );
    }
  }
  async function reset() {
    setMessage(null);
    setError(null);
    try {
      await apiClient.resetDemo();
      setMessage("Demo restored to its original signal.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Reset failed.");
    }
  }
  async function disconnect() {
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/gmail/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("Gmail could not disconnect.");
      setMessage("Gmail disconnected locally. No email data was deleted.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Disconnect failed.");
    }
  }
  async function exportData() {
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/account");
      if (!response.ok)
        throw new Error(
          "Account export is available after the settings backend stack is merged.",
        );
      const payload = (await response.json()) as { data: unknown };
      const blob = new Blob([JSON.stringify(payload.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "inb0x-account-export.json";
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Account export downloaded.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Export failed.");
    }
  }
  if (loading)
    return (
      <div className="settings-grid">
        <div className="skeleton" style={{ minHeight: 480 }} />
        <div className="skeleton" style={{ minHeight: 320 }} />
      </div>
    );
  return (
    <div className="settings-grid">
      <div className="stack">
        <section className="surface surface-pad">
          <div className="surface-header">
            <div>
              <h2>Workspace preferences</h2>
              <p>Keep the operating layer aligned with how you work.</p>
            </div>
            <span className="status-label">{demo ? "Demo" : "Live"}</span>
          </div>
          <div className="settings-section">
            <div className="setting-line">
              <div>
                <strong>Profile</strong>
                <span>Demo Judge · judge@inb0x.demo</span>
              </div>
              <span className="avatar">JD</span>
            </div>
            <div className="setting-line">
              <div>
                <strong>Appearance</strong>
                <span>Dark-first visual system</span>
              </div>
              <span className="status-label connected">Dark</span>
            </div>
            <div className="setting-line">
              <div>
                <strong>Timezone</strong>
                <span>UTC in the current dashboard contract</span>
              </div>
              <span className="status-label">UTC</span>
            </div>
          </div>
          <div className="settings-section">
            <h3>Default reply style</h3>
            <div className="field">
              <label htmlFor="settings-tone">Tone</label>
              <select
                id="settings-tone"
                className="form-select"
                value={tone}
                onChange={(event) => {
                  const value = event.target.value as ReplyTone;
                  setTone(value);
                  void save({ preferredTone: value });
                }}
              >
                {["direct", "balanced", "warm", "professional"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="settings-length">Length</label>
              <select
                id="settings-length"
                className="form-select"
                value={length}
                onChange={(event) => {
                  const value = event.target.value as ReplyLength;
                  setLength(value);
                  void save({ preferredReplyLength: value });
                }}
              >
                {["short", "medium", "detailed"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
        <section className="surface surface-pad">
          <div className="surface-header">
            <div>
              <h2>Dashboard controls</h2>
              <p>
                Additional preference persistence is staged with the settings
                backend.
              </p>
            </div>
          </div>
          <div className="stack">
            <div className="setting-line">
              <div>
                <strong>Compact mode</strong>
                <span>Condense dense data panels</span>
              </div>
              <span className="status-label">Coming next</span>
            </div>
            <div className="setting-line">
              <div>
                <strong>Landing page</strong>
                <span>Choose Dashboard, Inbox, or Tasks</span>
              </div>
              <span className="status-label">Coming next</span>
            </div>
            <div className="setting-line">
              <div>
                <strong>Locale</strong>
                <span>Future-ready profile metadata</span>
              </div>
              <span className="status-label">Coming next</span>
            </div>
          </div>
        </section>
      </div>
      <aside className="stack">
        <section className="surface surface-pad">
          <div className="surface-header">
            <div>
              <h2>AI usage</h2>
              <p>Model calls begin only after an explicit action.</p>
            </div>
            <Icon name="activity" />
          </div>
          {settings && (
            <div className="stack">
              <div className="setting-line">
                <div>
                  <strong>Daily analysis limit</strong>
                  <span>Remaining usage is server controlled</span>
                </div>
                <strong>{settings.dailyAnalysisLimit}</strong>
              </div>
              <div className="setting-line">
                <div>
                  <strong>Gmail lookback</strong>
                  <span>Recent messages only</span>
                </div>
                <strong>{settings.gmailLookbackDays}d</strong>
              </div>
              <div className="success-box">
                <Icon name="check" /> No background analysis. No hidden calls.
              </div>
            </div>
          )}
        </section>
        <section className="surface surface-pad">
          <div className="surface-header">
            <div>
              <h2>Gmail connection</h2>
              <p>Read-only authorization, separate from sign-in.</p>
            </div>
            <span className="status-label connected">
              <span className="status-dot connected" /> Connected
            </span>
          </div>
          <p className="muted">judge@inb0x.demo</p>
          <div className="control-row">
            <a
              className="button secondary"
              href={demo ? "/settings" : "/api/gmail/connect"}
            >
              {demo ? "Demo connection" : "Reconnect Gmail"}
            </a>
            <button
              className="button ghost"
              type="button"
              onClick={() => void disconnect()}
            >
              Disconnect
            </button>
          </div>
        </section>
        <section className="surface surface-pad">
          <div className="surface-header">
            <div>
              <h2>Data controls</h2>
              <p>These actions are explicit and reversible where possible.</p>
            </div>
          </div>
          <div className="stack">
            <button
              className="button secondary"
              type="button"
              onClick={() => void exportData()}
            >
              <Icon name="copy" /> Export account data
            </button>
            {demo && (
              <button
                className="button secondary"
                type="button"
                onClick={() => void reset()}
              >
                <Icon name="activity" /> Reset demo data
              </button>
            )}
            <div className="warning-box">
              <strong>Account deletion</strong>
              <br />
              The destructive account endpoint is staged in PR #8 and will
              require an exact confirmation phrase after merge.
            </div>
          </div>
        </section>
        {message && (
          <div className="success-box" role="status">
            <Icon name="check" /> {message}
          </div>
        )}
        {error && (
          <div className="danger-box" role="alert">
            <Icon name="warning" /> {error}
          </div>
        )}
      </aside>
    </div>
  );
}
