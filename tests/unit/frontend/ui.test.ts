import { describe, expect, it } from "vitest";
import { classNames, formatDate, formatRelativeTime, initials } from "@/lib/ui";

describe("frontend display helpers", () => {
  it("handles safe date fallbacks", () => {
    expect(formatDate(null)).toBe("No date set");
    expect(formatRelativeTime("not-a-date")).toBe("Unknown date");
  });

  it("creates compact initials without exposing extra identity", () => {
    expect(initials("Demo Judge")).toBe("DJ");
    expect(initials("judge@inb0x.demo")).toBe("JI");
    expect(initials(null)).toBe("I");
  });

  it("joins only active class names", () => {
    expect(classNames("surface", false, undefined, "active")).toBe(
      "surface active",
    );
  });
});
