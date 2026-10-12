import { beforeEach, describe, expect, it, vi } from "vitest";
import type { gmail_v1 } from "googleapis";
import { plainTextThread } from "../fixtures/gmail";

const mocks = vi.hoisted(() => ({
  gmailFactory: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  getAuthenticatedGoogleClient: vi.fn(),
  getGmailConnectionStatus: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  getEnvironment: vi.fn(),
  getRealSettings: vi.fn(),
  cleanExpiredEmailText: vi.fn(),
}));

vi.mock("googleapis", () => ({
  google: { gmail: mocks.gmailFactory },
}));
vi.mock("@/server/gmail/connection-service", () => ({
  getAuthenticatedGoogleClient: mocks.getAuthenticatedGoogleClient,
  getGmailConnectionStatus: mocks.getGmailConnectionStatus,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));
vi.mock("@/lib/env", () => ({ getEnvironment: mocks.getEnvironment }));
vi.mock("@/server/services/real-data", () => ({
  getRealSettings: mocks.getRealSettings,
}));
vi.mock("@/server/services/retention", () => ({
  cleanExpiredEmailText: mocks.cleanExpiredEmailText,
}));

import {
  listPersistedThreads,
  synchronizeGmailThreads,
} from "@/server/gmail/service";

interface StoredRow {
  id: string;
  user_id: string;
  gmail_thread_id: string;
  content_hash: string;
  latest_message_at: string;
  normalized_text: string | null;
  [key: string]: unknown;
}

class QueryBuilder {
  private operation: "select" | "update" = "select";
  private updateValue: Record<string, unknown> = {};
  private filters = new Map<string, unknown>();

  constructor(
    private readonly table: string,
    private readonly rows: Map<string, StoredRow>,
  ) {}

  select() {
    return this;
  }

  update(value: Record<string, unknown>) {
    this.operation = "update";
    this.updateValue = value;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.set(column, value);
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.set(column, value);
    return this;
  }

  lte() {
    return this;
  }

  async maybeSingle() {
    if (this.table !== "email_threads") return { data: null, error: null };
    const gmailThreadId = this.filters.get("gmail_thread_id");
    const id = this.filters.get("id");
    const row =
      typeof gmailThreadId === "string"
        ? this.rows.get(gmailThreadId)
        : [...this.rows.values()].find((item) => item.id === id);
    if (this.operation === "update" && row) {
      Object.assign(row, this.updateValue);
      return { data: { id: row.id }, error: null };
    }
    return { data: row ?? null, error: null };
  }

  then<TResult1 = { data: null; error: null }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: null;
          error: null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    if (this.operation === "update" && this.table === "email_threads") {
      const id = this.filters.get("id");
      const row = [...this.rows.values()].find((item) => item.id === id);
      if (row) Object.assign(row, this.updateValue);
    }
    return Promise.resolve({ data: null, error: null }).then(
      onfulfilled,
      onrejected,
    );
  }
}

function createDatabase(rows: Map<string, StoredRow>) {
  return {
    from(table: string) {
      return {
        select: () => new QueryBuilder(table, rows).select(),
        update: (value: Record<string, unknown>) =>
          new QueryBuilder(table, rows).update(value),
        insert: async (value: Record<string, unknown>) => {
          const gmailThreadId = String(value.gmail_thread_id);
          rows.set(gmailThreadId, {
            ...value,
            id: `db-${gmailThreadId}`,
            user_id: String(value.user_id),
            gmail_thread_id: gmailThreadId,
            content_hash: String(value.content_hash),
            latest_message_at: String(value.latest_message_at),
            normalized_text: String(value.normalized_text),
          });
          return { error: null };
        },
      };
    },
  };
}

function fixture(id: string, body: string): gmail_v1.Schema$Thread {
  const value = structuredClone(plainTextThread);
  value.id = id;
  if (value.messages?.[0]) {
    value.messages[0].id = `${id}-message`;
    value.messages[0].payload!.body!.data =
      Buffer.from(body).toString("base64url");
  }
  return value;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.gmailFactory.mockReturnValue({
    users: { threads: { list: mocks.list, get: mocks.get } },
  });
  mocks.getAuthenticatedGoogleClient.mockResolvedValue({});
  mocks.getGmailConnectionStatus.mockResolvedValue({ connected: true });
  mocks.getEnvironment.mockReturnValue({
    GMAIL_LOOKBACK_DAYS: 30,
    GMAIL_MAX_THREADS: 50,
    THREAD_MAX_CHARACTERS: 12_000,
    DATA_RETENTION_HOURS: 24,
  });
  mocks.getRealSettings.mockResolvedValue({
    gmailLookbackDays: 30,
    gmailMaxThreads: 50,
    dataRetentionHours: 24,
  });
  mocks.cleanExpiredEmailText.mockResolvedValue(0);
});

describe("Gmail synchronization service", () => {
  it("requires a Gmail connection before listing persisted mail", async () => {
    mocks.getGmailConnectionStatus.mockResolvedValue({
      connected: false,
      requiresReauthorization: false,
    });
    await expect(
      listPersistedThreads("auth-user", { limit: 25 }),
    ).rejects.toMatchObject({ code: "GMAIL_NOT_CONNECTED", status: 409 });
    expect(mocks.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("uses only read calls, persists successes, and tolerates a failed thread", async () => {
    const rows = new Map<string, StoredRow>();
    mocks.createSupabaseAdminClient.mockReturnValue(createDatabase(rows));
    mocks.list.mockResolvedValue({
      data: {
        threads: [{ id: "created" }, { id: "failed" }],
        nextPageToken: "provider-next",
      },
    });
    mocks.get.mockImplementation(async ({ id }: { id: string }) => {
      if (id === "failed") throw { response: { status: 404 } };
      return { data: fixture(id, "Safe synchronized content") };
    });

    const result = await synchronizeGmailThreads("auth-user", {
      limit: 25,
      query: "from:boss@example.test",
    });

    expect(result).toMatchObject({
      requested: 2,
      fetched: 1,
      created: 1,
      updated: 0,
      unchanged: 0,
      failed: 1,
      nextPageToken: "provider-next",
    });
    expect(rows.get("created")?.normalized_text).toContain(
      "Safe synchronized content",
    );
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "me",
        maxResults: 25,
        q: "in:inbox newer_than:30d -in:spam -in:trash (from:boss@example.test)",
      }),
      { timeout: 15_000 },
    );
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(mocks.cleanExpiredEmailText).toHaveBeenCalledWith("auth-user", 24);
  });

  it("is idempotent when normalized content is unchanged", async () => {
    const rows = new Map<string, StoredRow>();
    mocks.createSupabaseAdminClient.mockReturnValue(createDatabase(rows));
    mocks.list.mockResolvedValue({ data: { threads: [{ id: "same" }] } });
    mocks.get.mockResolvedValue({ data: fixture("same", "Unchanged") });

    const first = await synchronizeGmailThreads("auth-user", { limit: 1 });
    const second = await synchronizeGmailThreads("auth-user", { limit: 1 });

    expect(first.created).toBe(1);
    expect(second).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
    expect(rows.size).toBe(1);
  });

  it("surfaces an expired grant instead of hiding it as a partial failure", async () => {
    const rows = new Map<string, StoredRow>();
    mocks.createSupabaseAdminClient.mockReturnValue(createDatabase(rows));
    mocks.list.mockResolvedValue({ data: { threads: [{ id: "expired" }] } });
    mocks.get.mockRejectedValue({ response: { status: 401 } });

    await expect(
      synchronizeGmailThreads("auth-user", { limit: 1 }),
    ).rejects.toMatchObject({ code: "GMAIL_AUTH_EXPIRED", status: 401 });
    expect(rows.size).toBe(0);
  });
});
