import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  getDashboard: vi.fn(),
}));
vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));
vi.mock("@/server/dashboard/dashboard-service", () => ({
  getDashboard: mocks.getDashboard,
}));

import { GET } from "@/app/api/dashboard/route";
import { getDemoDashboard } from "@/mock/dashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCurrentUser.mockResolvedValue({
    id: "user-1",
    email: "user@example.test",
    demo: false,
  });
  mocks.getDashboard.mockResolvedValue(getDemoDashboard("UTC"));
});

describe("GET /api/dashboard", () => {
  it("requires authentication", async () => {
    mocks.requireCurrentUser.mockRejectedValue(
      new AppError("UNAUTHENTICATED", "Please sign in to continue.", 401),
    );
    const response = await GET(new Request("http://localhost/api/dashboard"));
    expect(response.status).toBe(401);
    expect(mocks.getDashboard).not.toHaveBeenCalled();
  });
  it("passes only the authenticated user and validated timezone", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/dashboard?timezone=Asia%2FKuala_Lumpur",
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.getDashboard).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1" }),
      "Asia/Kuala_Lumpur",
    );
    expect((await response.json()).meta.externalCalls).toBe(false);
  });
  it("rejects client user IDs and invalid timezones", async () => {
    expect(
      (await GET(new Request("http://localhost/api/dashboard?userId=other")))
        .status,
    ).toBe(400);
    expect(
      (
        await GET(
          new Request("http://localhost/api/dashboard?timezone=Invalid%2FZone"),
        )
      ).status,
    ).toBe(400);
  });
});
