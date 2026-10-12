// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReplyExample } from "@/components/reply-example";

afterEach(cleanup);
describe("marketing reply demonstration", () => {
  it("changes tone locally and preserves the copy-only boundary", () => {
    render(<ReplyExample />);
    expect(
      screen
        .getByRole("button", { name: "Balanced" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Direct" }));
    expect(
      screen
        .getByRole("button", { name: "Direct" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByRole("status").textContent).toContain(
      "I’ll review the proposal",
    );
    fireEvent.click(screen.getByRole("button", { name: "Warm" }));
    expect(screen.getByRole("status").textContent).toContain(
      "Thanks for putting this together",
    );
    expect(screen.getByText("Nothing sent")).toBeTruthy();
    expect(screen.getByText(/Prewritten examples/)).toBeTruthy();
  });
});
