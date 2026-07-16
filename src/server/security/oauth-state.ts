import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";

export const OAUTH_STATE_TTL_MS = 10 * 60_000;

function requireStateSecret(secret: string | undefined): string {
  if (!secret || secret.length < 32)
    throw new AppError(
      "GOOGLE_CONFIGURATION_ERROR",
      "Google OAuth state protection is not configured.",
      503,
    );
  return secret;
}

export function createOAuthStateValue(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOAuthState(state: string, secret: string): string {
  return createHmac("sha256", requireStateSecret(secret))
    .update(state)
    .digest("hex");
}

export function stateValuesMatch(received: string, expected: string): boolean {
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return (
    receivedBytes.length === expectedBytes.length &&
    timingSafeEqual(receivedBytes, expectedBytes)
  );
}

export interface OAuthStateRecord {
  id: string;
  user_id: string;
  expires_at: string;
  consumed_at: string | null;
}

export function validateOAuthStateRecord(
  record: OAuthStateRecord | null,
  expectedUserId: string,
  now = Date.now(),
): OAuthStateRecord {
  if (!record || record.user_id !== expectedUserId || record.consumed_at)
    throw new AppError(
      "OAUTH_STATE_INVALID",
      "The Gmail authorization request is invalid.",
      403,
    );
  if (Date.parse(record.expires_at) <= now)
    throw new AppError(
      "OAUTH_STATE_EXPIRED",
      "The Gmail authorization request expired. Please try again.",
      403,
    );
  return record;
}

export async function issueOAuthState(
  userId: string,
  now = Date.now(),
): Promise<string> {
  const state = createOAuthStateValue();
  const secret = requireStateSecret(getEnvironment().OAUTH_STATE_SECRET);
  const { error } = await createSupabaseAdminClient()
    .from("oauth_states")
    .insert({
      user_id: userId,
      state_hash: hashOAuthState(state, secret),
      expires_at: new Date(now + OAUTH_STATE_TTL_MS).toISOString(),
    });
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Gmail authorization could not be started.",
      500,
    );
  return state;
}

export async function consumeOAuthState(
  state: string,
  expectedUserId: string,
  now = Date.now(),
): Promise<void> {
  if (!state)
    throw new AppError(
      "OAUTH_STATE_INVALID",
      "The Gmail authorization request is invalid.",
      403,
    );
  const secret = requireStateSecret(getEnvironment().OAUTH_STATE_SECRET);
  const database = createSupabaseAdminClient();
  const stateHash = hashOAuthState(state, secret);
  const { data, error } = await database
    .from("oauth_states")
    .select("id,user_id,expires_at,consumed_at")
    .eq("state_hash", stateHash)
    .maybeSingle();
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Gmail authorization could not be validated.",
      500,
    );
  const consumedAt = new Date(now).toISOString();
  let validRecord: OAuthStateRecord;
  try {
    validRecord = validateOAuthStateRecord(
      data as OAuthStateRecord | null,
      expectedUserId,
      now,
    );
  } catch (validationError) {
    if (
      validationError instanceof AppError &&
      validationError.code === "OAUTH_STATE_EXPIRED" &&
      data
    ) {
      await database
        .from("oauth_states")
        .update({ consumed_at: consumedAt })
        .eq("id", data.id)
        .is("consumed_at", null);
    }
    throw validationError;
  }

  const { data: consumed, error: consumeError } = await database
    .from("oauth_states")
    .update({ consumed_at: consumedAt })
    .eq("id", validRecord.id)
    .eq("user_id", expectedUserId)
    .is("consumed_at", null)
    .gt("expires_at", consumedAt)
    .select("id")
    .maybeSingle();
  if (consumeError)
    throw new AppError(
      "INTERNAL_ERROR",
      "Gmail authorization could not be validated.",
      500,
    );
  if (!consumed)
    throw new AppError(
      "OAUTH_STATE_INVALID",
      "The Gmail authorization request was already used.",
      403,
    );
}
