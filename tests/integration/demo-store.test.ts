import { beforeEach, describe, expect, it } from "vitest";
import {
  createDemoDraft,
  createDemoTask,
  deleteDemoTask,
  getDemoThread,
  listDemoTasks,
  listDemoThreads,
  resetDemo,
  updateDemoTask,
} from "@/server/services/demo-store";

beforeEach(resetDemo);
describe("credential-free demo workflows", () => {
  it("lists fictional threads and the prompt-injection fixture", () => {
    expect(listDemoThreads()).toHaveLength(12);
    expect(getDemoThread("prompt-injection")?.analysis?.safetyFlags).toContain(
      "possible_prompt_injection",
    );
  });
  it("creates, updates, and deletes a task", () => {
    const task = createDemoTask({ title: "Verify demo", priority: "high" });
    expect(listDemoTasks().some((item) => item.id === task.id)).toBe(true);
    expect(
      updateDemoTask(task.id, { status: "completed" })?.completedAt,
    ).not.toBeNull();
    expect(deleteDemoTask(task.id)).toBe(true);
  });
  it("creates a manual-copy draft and never sends", () => {
    const draft = createDemoDraft("proposal-approval", "professional", "short");
    expect(draft.isDraftOnly).toBe(true);
    expect(draft.subject).toMatch(/^Re:/);
  });
});
