import { getEnvironment } from "@/lib/env";
import { SettingsPanel } from "@/components/settings-panel";
export default function SettingsPage() {
  const demo = getEnvironment().DEMO_MODE;
  return (
    <main>
      <div className="shell grid">
        <div>
          <span className="tag">{demo ? "Demo mode" : "Real mode"}</span>
          <h1>Settings</h1>
          <p className="muted">
            Connections, limits, retention, and data controls.
          </p>
        </div>
        <SettingsPanel demo={demo} />
      </div>
    </main>
  );
}
