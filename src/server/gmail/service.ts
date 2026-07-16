import { google } from "googleapis";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  getAuthenticatedGoogleClient,
  getGmailConnectionStatus,
} from "@/server/gmail/connection-service";
import {
  normalizeGmailThread,
  type NormalizedThread,
} from "@/server/gmail/normalize";
import { cleanExpiredEmailText } from "@/server/services/retention";
import { getRealSettings } from "@/server/services/real-data";
import type {
  AttachmentMetadata,
  EmailMessage,
  EmailThreadDetail,
  EmailThreadListItem,
  GmailSyncResult,
} from "@/types/contracts";

const GMAIL_REQUEST_TIMEOUT_MS = 15_000;
const GMAIL_FETCH_CONCURRENCY = 4;
const MAX_GMAIL_RETRIES = 1;
const MAX_PUBLIC_PAGE_SIZE = 50;

export const ALLOWED_GMAIL_READ_OPERATIONS = [
  "users.threads.list",
  "users.threads.get",
  "users.messages.get",
  "users.getProfile",
] as const;

export const FORBIDDEN_GMAIL_WRITE_OPERATIONS = [
  "users.messages.send",
  "users.messages.modify",
  "users.messages.delete",
  "users.threads.modify",
  "users.threads.delete",
  "users.drafts.create",
  "users.drafts.send",
  "users.messages.trash",
  "users.messages.untrash",
  "users.threads.trash",
  "users.threads.untrash",
] as const;

type GmailClient = ReturnType<typeof google.gmail>;
type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

interface GmailListOptions {
  lookbackDays: number;
  limit: number;
  query?: string | undefined;
  pageToken?: string | undefined;
}

export interface PersistedThreadListInput {
  limit: number;
  pageToken?: string | undefined;
  query?: string | undefined;
  category?: string | undefined;
  priority?: string | undefined;
  needsReply?: boolean | undefined;
}

export interface PersistedThreadListResult {
  threads: EmailThreadListItem[];
  nextPageToken: string | null;
}

interface GmailSyncInput {
  limit: number;
  query?: string | undefined;
  pageToken?: string | undefined;
}

interface StoredThreadRow {
  id: string;
  subject: string;
  participants: string[];
  sender_names: string[];
  message_count: number;
  latest_message_at: string;
  snippet: string;
  has_attachments: boolean;
  gmail_labels: string[];
  content_hash: string;
  normalized_character_count: number;
  content_trimmed: boolean;
  contains_potential_prompt_injection: boolean;
  messages?: unknown;
}

function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const record = error as {
    code?: unknown;
    status?: unknown;
    response?: { status?: unknown };
  };
  for (const value of [record.response?.status, record.status, record.code]) {
    const status = Number(value);
    if (Number.isInteger(status) && status >= 100 && status <= 599)
      return status;
  }
  return null;
}

export function isTransientGmailError(error: unknown): boolean {
  const status = errorStatus(error);
  return status === 429 || Boolean(status && status >= 500 && status <= 599);
}

function mapGmailError(error: unknown, notFoundIsThread = false): AppError {
  const status = errorStatus(error);
  if (status === 401)
    return new AppError(
      "GMAIL_AUTH_EXPIRED",
      "Gmail authorization expired. Please reconnect Gmail.",
      401,
    );
  if (status === 403)
    return new AppError(
      "GMAIL_PERMISSION_DENIED",
      "Gmail access was denied. Reconnect Gmail and approve read-only access.",
      403,
    );
  if (status === 429)
    return new AppError(
      "GMAIL_RATE_LIMITED",
      "Gmail is temporarily rate limited. Please try again shortly.",
      429,
    );
  if (status === 404 && notFoundIsThread)
    return new AppError(
      "THREAD_NOT_FOUND",
      "The requested email thread was not found.",
      404,
    );
  return new AppError(
    "GMAIL_SYNC_FAILED",
    "Gmail synchronization could not be completed.",
    502,
  );
}

export async function withTransientGmailRetry<T>(
  operation: () => Promise<T>,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
  random: () => number = Math.random,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_GMAIL_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientGmailError(error) || attempt === MAX_GMAIL_RETRIES)
        throw error;
      const delay = 200 * 2 ** attempt + Math.floor(random() * 100);
      await wait(delay);
    }
  }
  throw lastError;
}

export function sanitizeGmailQuery(
  value: string | undefined,
): string | undefined {
  const normalized = value
    ?.replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || undefined;
}

export function buildGmailSearchQuery(
  lookbackDays: number,
  userQuery?: string,
): string {
  const boundedDays = Math.min(Math.max(Math.trunc(lookbackDays), 1), 365);
  const base = `in:inbox newer_than:${boundedDays}d -in:spam -in:trash`;
  const query = sanitizeGmailQuery(userQuery);
  return query ? `${base} (${query})` : base;
}

function createGmailClient(
  auth: Awaited<ReturnType<typeof getAuthenticatedGoogleClient>>,
): GmailClient {
  return google.gmail({ version: "v1", auth });
}

async function listRecentGmailThreads(
  gmail: GmailClient,
  options: GmailListOptions,
) {
  try {
    const response = await withTransientGmailRetry(() =>
      gmail.users.threads.list(
        {
          userId: "me",
          maxResults: Math.min(
            Math.max(options.limit, 1),
            MAX_PUBLIC_PAGE_SIZE,
          ),
          q: buildGmailSearchQuery(options.lookbackDays, options.query),
          ...(options.pageToken ? { pageToken: options.pageToken } : {}),
        },
        { timeout: GMAIL_REQUEST_TIMEOUT_MS },
      ),
    );
    return response.data;
  } catch (error) {
    throw mapGmailError(error);
  }
}

async function getNormalizedGmailThread(
  gmail: GmailClient,
  threadId: string,
  maxCharacters: number,
): Promise<NormalizedThread> {
  try {
    const response = await withTransientGmailRetry(() =>
      gmail.users.threads.get(
        { userId: "me", id: threadId, format: "full" },
        { timeout: GMAIL_REQUEST_TIMEOUT_MS },
      ),
    );
    return normalizeGmailThread(response.data, maxCharacters);
  } catch (error) {
    throw mapGmailError(error, true);
  }
}

export async function mapWithConcurrency<TInput, TOutput>(
  values: readonly TInput[],
  concurrency: number,
  operation: (value: TInput) => Promise<TOutput>,
): Promise<PromiseSettledResult<TOutput>[]> {
  const results: PromiseSettledResult<TOutput>[] = new Array(values.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      const value = values[index];
      if (value === undefined) continue;
      try {
        results[index] = { status: "fulfilled", value: await operation(value) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), values.length) },
      worker,
    ),
  );
  return results;
}

function databaseRow(
  userId: string,
  thread: NormalizedThread,
  syncedAt: string,
) {
  return {
    user_id: userId,
    gmail_thread_id: thread.gmailThreadId,
    gmail_history_id: thread.gmailHistoryId,
    subject: thread.subject,
    participants: thread.participants,
    sender_names: thread.senderNames,
    message_count: thread.messageCount,
    latest_message_at: thread.latestMessageAt,
    snippet: thread.snippet,
    normalized_text: thread.normalizedText,
    normalized_character_count: thread.normalizedCharacterCount,
    content_hash: thread.contentHash,
    content_trimmed: thread.trimmed,
    contains_potential_prompt_injection:
      thread.containsPotentialPromptInjection,
    messages: thread.messages,
    has_attachments: thread.hasAttachments,
    gmail_labels: thread.gmailLabels,
    synced_at: syncedAt,
  };
}

type PersistenceResult = "created" | "updated" | "unchanged";

async function persistNormalizedThread(
  database: SupabaseAdminClient,
  userId: string,
  thread: NormalizedThread,
  syncedAt: string,
  retryOnUnique = true,
): Promise<PersistenceResult> {
  const { data: existing, error: loadError } = await database
    .from("email_threads")
    .select("id,content_hash,latest_message_at,normalized_text")
    .eq("user_id", userId)
    .eq("gmail_thread_id", thread.gmailThreadId)
    .maybeSingle();
  if (loadError)
    throw new AppError(
      "GMAIL_SYNC_FAILED",
      "Email thread storage could not be updated.",
      500,
    );

  const row = databaseRow(userId, thread, syncedAt);
  if (!existing) {
    const { error } = await database.from("email_threads").insert(row);
    if (!error) return "created";
    if (error.code !== "23505")
      throw new AppError(
        "GMAIL_SYNC_FAILED",
        "Email thread storage could not be updated.",
        500,
      );
    if (!retryOnUnique)
      throw new AppError(
        "GMAIL_SYNC_FAILED",
        "Email thread storage could not be updated.",
        500,
      );
    return persistNormalizedThread(database, userId, thread, syncedAt, false);
  }

  if (
    existing.content_hash === thread.contentHash &&
    existing.normalized_text !== null
  ) {
    const { error } = await database
      .from("email_threads")
      .update({ synced_at: syncedAt })
      .eq("id", existing.id)
      .eq("user_id", userId);
    if (error)
      throw new AppError(
        "GMAIL_SYNC_FAILED",
        "Email thread storage could not be updated.",
        500,
      );
    return "unchanged";
  }

  if (
    Date.parse(existing.latest_message_at) > Date.parse(thread.latestMessageAt)
  )
    return "unchanged";
  const { data: updated, error: updateError } = await database
    .from("email_threads")
    .update(row)
    .eq("id", existing.id)
    .eq("user_id", userId)
    .eq("content_hash", existing.content_hash)
    .lte("latest_message_at", thread.latestMessageAt)
    .select("id")
    .maybeSingle();
  if (updateError)
    throw new AppError(
      "GMAIL_SYNC_FAILED",
      "Email thread storage could not be updated.",
      500,
    );
  return updated ? "updated" : "unchanged";
}

export async function synchronizeGmailThreads(
  userId: string,
  input: GmailSyncInput,
): Promise<GmailSyncResult> {
  const environment = getEnvironment();
  const settings = await getRealSettings(userId);
  const auth = await getAuthenticatedGoogleClient(userId);
  const gmail = createGmailClient(auth);
  const listed = await listRecentGmailThreads(gmail, {
    lookbackDays: Math.min(
      settings.gmailLookbackDays,
      environment.GMAIL_LOOKBACK_DAYS,
    ),
    limit: Math.min(
      input.limit,
      settings.gmailMaxThreads,
      environment.GMAIL_MAX_THREADS,
    ),
    query: input.query,
    pageToken: input.pageToken,
  });
  const ids = (listed.threads ?? []).flatMap((thread) =>
    thread.id ? [thread.id] : [],
  );
  const fetched = await mapWithConcurrency(
    ids,
    GMAIL_FETCH_CONCURRENCY,
    (threadId) =>
      getNormalizedGmailThread(
        gmail,
        threadId,
        environment.THREAD_MAX_CHARACTERS,
      ),
  );
  const database = createSupabaseAdminClient();
  const syncedAt = new Date().toISOString();
  const summary: GmailSyncResult = {
    requested: ids.length,
    fetched: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
    nextPageToken: listed.nextPageToken ?? null,
    syncedAt,
  };
  for (const result of fetched) {
    if (result.status === "rejected") {
      if (
        result.reason instanceof AppError &&
        [
          "GMAIL_AUTH_EXPIRED",
          "GMAIL_PERMISSION_DENIED",
          "GMAIL_RATE_LIMITED",
        ].includes(result.reason.code)
      )
        throw result.reason;
      summary.failed += 1;
      continue;
    }
    summary.fetched += 1;
    try {
      const persistence = await persistNormalizedThread(
        database,
        userId,
        result.value,
        syncedAt,
      );
      summary[persistence] += 1;
    } catch {
      summary.failed += 1;
    }
  }
  const { error: connectionError } = await database
    .from("gmail_connections")
    .update({ last_synced_at: syncedAt })
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (connectionError)
    throw new AppError(
      "GMAIL_SYNC_FAILED",
      "Gmail synchronization status could not be saved.",
      500,
    );
  await cleanExpiredEmailText(
    userId,
    Math.min(settings.dataRetentionHours, environment.DATA_RETENTION_HOURS),
  );
  return summary;
}

function parsePageToken(value: string | undefined): number {
  if (!value) return 0;
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    if (!/^\d+$/.test(decoded)) throw new Error("invalid cursor");
    const offset = Number(decoded);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100_000)
      throw new Error("invalid cursor");
    return offset;
  } catch {
    throw new AppError("INVALID_REQUEST", "The page token is invalid.", 400);
  }
}

function nextPageToken(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

async function assertGmailConnectionAvailable(userId: string): Promise<void> {
  const status = await getGmailConnectionStatus(userId);
  if (status.connected) return;
  if (status.requiresReauthorization)
    throw new AppError(
      "GMAIL_AUTH_EXPIRED",
      "Gmail authorization expired. Please reconnect Gmail.",
      401,
    );
  throw new AppError(
    "GMAIL_NOT_CONNECTED",
    "Connect Gmail before continuing.",
    409,
  );
}

function cleanStoredQuery(value: string | undefined): string | undefined {
  const clean = value
    ?.replace(/[,%_()'"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean || undefined;
}

function listItemFromRow(row: StoredThreadRow): EmailThreadListItem {
  return {
    id: row.id,
    subject: row.subject,
    participants: row.participants,
    senderNames: row.sender_names,
    snippet: row.snippet,
    latestMessageAt: row.latest_message_at,
    messageCount: row.message_count,
    hasAttachments: row.has_attachments,
    labels: row.gmail_labels,
    analysis: null,
  };
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function safeAttachments(value: unknown): AttachmentMetadata[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (
      typeof record.filename !== "string" ||
      typeof record.mimeType !== "string"
    )
      return [];
    return [
      {
        filename: record.filename,
        mimeType: record.mimeType,
        sizeBytes: Math.max(0, Number(record.sizeBytes) || 0),
      },
    ];
  });
}

function safeMessages(value: unknown): EmailMessage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (
      typeof record.id !== "string" ||
      typeof record.from !== "string" ||
      typeof record.sentAt !== "string" ||
      typeof record.body !== "string"
    )
      return [];
    return [
      {
        id: record.id,
        from: record.from,
        to: safeStringArray(record.to),
        cc: safeStringArray(record.cc),
        replyTo: typeof record.replyTo === "string" ? record.replyTo : null,
        sentAt: record.sentAt,
        subject:
          typeof record.subject === "string" ? record.subject : "(No subject)",
        body: record.body,
        mimeType:
          typeof record.mimeType === "string" ? record.mimeType : "text/plain",
        attachments: safeAttachments(record.attachments),
        trimmed: Boolean(record.trimmed),
        containsPotentialPromptInjection: Boolean(
          record.containsPotentialPromptInjection,
        ),
      },
    ];
  });
}

const STORED_THREAD_LIST_COLUMNS =
  "id,subject,participants,sender_names,message_count,latest_message_at,snippet,has_attachments,gmail_labels";
const STORED_THREAD_DETAIL_COLUMNS = `${STORED_THREAD_LIST_COLUMNS},content_hash,normalized_character_count,content_trimmed,contains_potential_prompt_injection,messages`;

export async function listPersistedThreads(
  userId: string,
  input: PersistedThreadListInput,
): Promise<PersistedThreadListResult> {
  await assertGmailConnectionAvailable(userId);
  if (
    input.category !== undefined ||
    input.priority !== undefined ||
    input.needsReply !== undefined
  )
    throw new AppError(
      "INVALID_REQUEST",
      "Category, priority, and reply filters require completed email analysis.",
      400,
    );
  const limit = Math.min(Math.max(input.limit, 1), MAX_PUBLIC_PAGE_SIZE);
  const offset = parsePageToken(input.pageToken);
  const storedQuery = cleanStoredQuery(input.query);
  let query = createSupabaseAdminClient()
    .from("email_threads")
    .select(STORED_THREAD_LIST_COLUMNS)
    .eq("user_id", userId)
    .order("latest_message_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit);
  if (storedQuery) query = query.ilike("subject", `%${storedQuery}%`);
  const { data, error } = await query;
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Email threads could not be loaded.",
      500,
    );
  const rows = (data ?? []) as unknown as StoredThreadRow[];
  const hasMore = rows.length > limit;
  return {
    threads: rows.slice(0, limit).map(listItemFromRow),
    nextPageToken: hasMore ? nextPageToken(offset + limit) : null,
  };
}

export async function getPersistedThread(
  userId: string,
  threadId: string,
): Promise<EmailThreadDetail> {
  await assertGmailConnectionAvailable(userId);
  const { data, error } = await createSupabaseAdminClient()
    .from("email_threads")
    .select(STORED_THREAD_DETAIL_COLUMNS)
    .eq("user_id", userId)
    .eq("id", threadId)
    .maybeSingle();
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The email thread could not be loaded.",
      500,
    );
  if (!data)
    throw new AppError(
      "THREAD_NOT_FOUND",
      "The requested email thread was not found.",
      404,
    );
  const row = data as unknown as StoredThreadRow;
  return {
    ...listItemFromRow(row),
    messages: safeMessages(row.messages),
    contentHash: row.content_hash,
    normalizedCharacterCount: row.normalized_character_count,
    trimmed: row.content_trimmed,
    containsPotentialPromptInjection: row.contains_potential_prompt_injection,
  };
}
