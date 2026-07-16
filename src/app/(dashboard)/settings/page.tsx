import { SettingsPanel } from "@/components/settings-panel";
import { PageShell } from "@/components/page-primitives";
import { getEnvironment } from "@/lib/env";
export default function SettingsPage() {
  return (
    <PageShell
      eyebrow="Signal room / settings"
      title="Settings"
      description="Tune the workspace, review permissions, and keep control of your data."
    >
      <SettingsPanel demo={getEnvironment().DEMO_MODE} />
    </PageShell>
  );
}
