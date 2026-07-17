"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { apiClient } from "@/lib/api-client";
import type {
  AppearanceMode,
  DefaultLandingPage,
  ReplyLength,
  ReplyTone,
  SettingsData,
  UpdateSettingsRequest,
} from "@/types/contracts";

export function SettingsPanel({ demo }: { demo: boolean }) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSettings() {
    const value = await apiClient.getSettings();
    setSettings(value);
    setDisplayName(value.profile.displayName ?? "");
  }

  useEffect(() => {
    let mounted = true;
    void apiClient
      .getSettings()
      .then((value) => {
        if (!mounted) return;
        setSettings(value);
        setDisplayName(value.profile.displayName ?? "");
      })
      .catch((value: unknown) => {
        if (mounted)
          setError(
            value instanceof Error ? value.message : "Settings could not load.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function save(input: UpdateSettingsRequest) {
    setMessage(null);
    setError(null);
    try {
      const next = await apiClient.updateSettings(input);
      setSettings(next);
      setDisplayName(next.profile.displayName ?? "");
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
      await loadSettings();
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
      await loadSettings();
      setMessage(
        "Gmail disconnected locally. No email-derived data was deleted.",
      );
    } catch (value) {
      setError(value instanceof Error ? value.message : "Disconnect failed.");
    }
  }

  async function exportData() {
    setMessage(null);
    setError(null);
    try {
      const account = await apiClient.getAccount();
      const blob = new Blob([JSON.stringify(account, null, 2)], {
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

  async function deleteAccount() {
    if (deleteConfirmation !== "DELETE MY ACCOUNT") return;
    setMessage(null);
    setError(null);
    try {
      await apiClient.deleteAccount("DELETE MY ACCOUNT");
      if (demo) {
        await loadSettings();
        setDeleteConfirmation("");
        setMessage("Demo account data reset.");
      } else {
        window.location.assign("/login");
      }
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Account deletion failed.",
      );
    }
  }

  if (loading)
    return (
      <div className="settings-grid">
        <div className="skeleton" style={{ minHeight: 480 }} />
        <div className="skeleton" style={{ minHeight: 320 }} />
      </div>
    );

  if (!settings)
    return (
      <div className="danger-box" role="alert">
        <Icon name="warning" /> {error ?? "Settings are unavailable."}
      </div>
    );

  return (
    <div className="settings-grid">
      <div className="stack">
        <section className="surface surface-pad connection-ledger">
          <div className="surface-header">
            <div>
              <h2>Workspace preferences</h2>
              <p>Persisted to your authenticated workspace.</p>
            </div>
            <span className="status-label">
              {settings.ai.demoMode ? "Demo" : "Live"}
            </span>
          </div>
          <div className="settings-section">
            <div className="field">
              <label htmlFor="settings-display-name">Display name</label>
              <div className="control-row">
                <input
                  id="settings-display-name"
                  className="form-input"
                  style={{ flex: 1 }}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
                <button
                  className="button secondary"
                  type="button"
                  disabled={!displayName.trim()}
                  onClick={() => void save({ displayName: displayName.trim() })}
                >
                  Save profile
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="settings-timezone">Timezone</label>
              <input
                id="settings-timezone"
                className="form-input"
                value={settings.profile.timezone}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    profile: {
                      ...settings.profile,
                      timezone: event.target.value,
                    },
                  })
                }
                onBlur={(event) => void save({ timezone: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="settings-locale">Locale</label>
              <input
                id="settings-locale"
                className="form-input"
                value={settings.profile.locale}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    profile: {
                      ...settings.profile,
                      locale: event.target.value,
                    },
                  })
                }
                onBlur={(event) => void save({ locale: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="settings-appearance">Appearance</label>
              <select
                id="settings-appearance"
                className="form-select"
                value={settings.appearance}
                onChange={(event) =>
                  void save({
                    appearance: event.target.value as AppearanceMode,
                  })
                }
              >
                <option value="dark">Dark</option>
                <option value="system">System</option>
                <option value="light">Light preference</option>
              </select>
            </div>
          </div>
          <div className="settings-section">
            <h3>Default reply style</h3>
            <div className="field">
              <label htmlFor="settings-tone">Tone</label>
              <select
                id="settings-tone"
                className="form-select"
                value={settings.ai.defaultReplyTone}
                onChange={(event) =>
                  void save({
                    defaultReplyTone: event.target.value as ReplyTone,
                  })
                }
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
                value={settings.ai.defaultReplyLength}
                onChange={(event) =>
                  void save({
                    defaultReplyLength: event.target.value as ReplyLength,
                  })
                }
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
              <p>Choose what appears in your default overview.</p>
            </div>
          </div>
          <div className="stack">
            <div className="field">
              <label htmlFor="settings-landing">Default landing page</label>
              <select
                id="settings-landing"
                className="form-select"
                value={settings.dashboard.defaultLandingPage}
                onChange={(event) =>
                  void save({
                    defaultLandingPage: event.target
                      .value as DefaultLandingPage,
                  })
                }
              >
                <option value="dashboard">Dashboard</option>
                <option value="inbox">Inbox</option>
                <option value="tasks">Tasks</option>
              </select>
            </div>
            {(
              [
                "compactMode",
                "showAnalytics",
                "showInboxHealth",
                "showRecentActivity",
              ] as const
            ).map((key) => (
              <label className="setting-line" key={key}>
                <span>
                  <strong>
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (value) => value.toUpperCase())}
                  </strong>
                  <span>Stored per workspace</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.dashboard[key]}
                  onChange={(event) =>
                    void save({ [key]: event.target.checked })
                  }
                />
              </label>
            ))}
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
          <div className="stack">
            <div className="setting-line">
              <div>
                <strong>Analysis</strong>
                <span>
                  {settings.ai.usage.analysis.remaining} remaining today
                </span>
              </div>
              <strong>
                {settings.ai.usage.analysis.used}/
                {settings.ai.usage.analysis.limit}
              </strong>
            </div>
            <div className="setting-line">
              <div>
                <strong>Reply drafts</strong>
                <span>
                  {settings.ai.usage.replies.remaining} remaining today
                </span>
              </div>
              <strong>
                {settings.ai.usage.replies.used}/
                {settings.ai.usage.replies.limit}
              </strong>
            </div>
            <div className="success-box">
              <Icon name="check" /> No background analysis. No hidden model
              calls.
            </div>
          </div>
        </section>
        <section className="surface surface-pad">
          <div className="surface-header">
            <div>
              <h2>Gmail connection</h2>
              <p>Read-only authorization, separate from sign-in.</p>
            </div>
            <span
              className={`status-label ${settings.gmail.connected ? "connected" : ""}`}
            >
              <span
                className={`status-dot ${settings.gmail.connected ? "connected" : ""}`}
              />{" "}
              {settings.gmail.connected
                ? "Read-only connected"
                : "Disconnected"}
            </span>
          </div>
          <p className="muted">
            {settings.gmail.gmailAddress ?? "No Gmail account connected"}
          </p>
          <div
            className="permission-ledger"
            aria-label="Gmail permission ledger"
          >
            <div>
              <Icon name="check" label="Allowed" />
              <span>
                <strong>Read messages</strong>
                Normalize and display owned inbox data for review.
              </span>
            </div>
            <div>
              <Icon name="close" label="Not allowed" />
              <span>
                <strong>No mailbox changes</strong>
                Inb0x cannot send, archive, delete, label, or mark messages
                read.
              </span>
            </div>
          </div>
          <div className="control-row">
            {!settings.gmail.connected && !demo && (
              <a className="button secondary" href="/api/gmail/connect">
                Connect Gmail read-only
              </a>
            )}
            {settings.gmail.connected && (
              <button
                className="button ghost"
                type="button"
                onClick={() => void disconnect()}
              >
                Disconnect
              </button>
            )}
          </div>
        </section>
        <section className="surface surface-pad">
          <div className="surface-header">
            <div>
              <h2>Data controls</h2>
              <p>Export and deletion are explicit authenticated actions.</p>
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
              <strong>Delete account</strong>
              <p>
                Type DELETE MY ACCOUNT to confirm. Production deletion removes
                your authenticated account and owned records.
              </p>
              <input
                className="form-input"
                aria-label="Account deletion confirmation"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="DELETE MY ACCOUNT"
              />
              <button
                className="button danger"
                style={{ marginTop: 10 }}
                type="button"
                disabled={deleteConfirmation !== "DELETE MY ACCOUNT"}
                onClick={() => void deleteAccount()}
              >
                Delete account
              </button>
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
