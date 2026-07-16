import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/errors";

interface StatePayload {
  nonce: string;
  userId: string;
  expiresAt: number;
}
function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
export function createOAuthState(
  userId: string,
  secret: string,
  now = Date.now(),
): string {
  if (secret.length < 32)
    throw new Error("OAUTH_STATE_SECRET must be at least 32 characters");
  const payload = Buffer.from(
    JSON.stringify({
      nonce: randomBytes(32).toString("base64url"),
      userId,
      expiresAt: now + 10 * 60_000,
    } satisfies StatePayload),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}
export function verifyOAuthState(
  value: string,
  secret: string,
  expectedUserId: string,
  now = Date.now(),
): StatePayload {
  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) throw new Error();
    const expected = Buffer.from(sign(payload, secret));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      throw new Error();
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as StatePayload;
    if (
      parsed.userId !== expectedUserId ||
      parsed.expiresAt < now ||
      !parsed.nonce
    )
      throw new Error();
    return parsed;
  } catch {
    throw new AppError(
      "FORBIDDEN",
      "The Gmail authorization request is invalid or expired.",
      403,
    );
  }
}
