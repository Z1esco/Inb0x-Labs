import { SettingsPanel } from "@/components/settings-panel";
import { PageShell } from "@/components/page-primitives";
import { getEnvironment } from "@/lib/env";
export default function SettingsPage() {
  return (
    <PageShell
      eyebrow="Workspace rules · permissions · data"
      title="Preferences"
      description="Set how the desk behaves and inspect exactly what it can access."
    >
      <SettingsPanel demo={getEnvironment().DEMO_MODE} />
    </PageShell>
  );
}
