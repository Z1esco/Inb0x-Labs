import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThreadVolumeChart } from "@/components/thread-volume-chart";

describe("thread volume presentation", () => {
  it("scales to the largest count and keeps zero at zero", () => {
    const html = renderToStaticMarkup(
      <ThreadVolumeChart
        points={[
          { date: "2026-07-16", count: 0 },
          { date: "2026-07-17", count: 1 },
          { date: "2026-07-18", count: 2 },
        ]}
      />,
    );
    expect(html).toContain("height:0%");
    expect(html).toContain("height:50%");
    expect(html).toContain("height:100%");
    expect(html).toContain('dateTime="2026-07-16"');
    expect(html).toContain("Jul 16");
  });
  it("explains an empty period", () => {
    expect(renderToStaticMarkup(<ThreadVolumeChart points={[]} />)).toContain(
      "No thread volume for this period",
    );
  });
});
