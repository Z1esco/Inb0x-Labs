// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { RelativeTime } from "@/components/page-primitives";

it("hydrates safely even when the relative-time bucket changes in transit", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-12T00:00:00Z"));
  const value = "2026-10-11T23:57:00Z";
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(<RelativeTime value={value} />);
  vi.setSystemTime(new Date("2026-10-12T00:02:00Z"));
  const recovered = vi.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, <RelativeTime value={value} />, {
        onRecoverableError: recovered,
      });
    });
    expect(recovered).not.toHaveBeenCalled();
    expect(container.textContent).toContain("5m ago");
  } finally {
    await act(async () => root?.unmount());
    container.remove();
    vi.useRealTimers();
  }
});
