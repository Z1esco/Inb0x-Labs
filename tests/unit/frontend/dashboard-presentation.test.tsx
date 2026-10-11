import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardView } from "@/components/dashboard-view";
import { demoDashboard } from "@/mock/dashboard";

describe("dashboard attention description", () => {
  it("uses the actual attention queue and labels the stored thread total", () => {
    const html = renderToStaticMarkup(
      <DashboardView initialData={demoDashboard} />,
    );
    expect(html).toContain("2 items need a decision");
    expect(html).toContain("stored threads");
    expect(html).not.toContain("threads can wait");
  });

  it("explains an empty queue without claiming a fixed number of decisions", () => {
    const html = renderToStaticMarkup(
      <DashboardView
        initialData={{
          ...demoDashboard,
          today: { ...demoDashboard.today, items: [] },
        }}
      />,
    );
    expect(html).toContain("Your attention queue is clear");
    expect(html).not.toContain("Three places");
  });

  it("uses singular wording for one item", () => {
    const html = renderToStaticMarkup(
      <DashboardView
        initialData={{
          ...demoDashboard,
          today: {
            ...demoDashboard.today,
            items: demoDashboard.today.items.slice(0, 1),
          },
        }}
      />,
    );
    expect(html).toContain("1 item needs a decision");
  });
});
