import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";

const payloadSchema = z.strictObject({
  v: z.literal(1),
  iv: z.string().base64(),
  tag: z.string().base64(),
  ciphertext: z.string().base64(),
});
export class TokenDecryptionError extends Error {
  constructor() {
    super("Encrypted token could not be decrypted");
    this.name = "TokenDecryptionError";
  }
}
export class SecretEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecretEncryptionError";
  }
}
function decodeKey(encodedKey: string): Buffer {
  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32)
    throw new SecretEncryptionError(
      "TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes",
    );
  return key;
}
export function encryptSecret(secret: string, encodedKey: string): string {
  if (!secret) throw new SecretEncryptionError("Secret must not be empty");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", decodeKey(encodedKey), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return JSON.stringify({
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  });
}
export function decryptSecret(serialized: string, encodedKey: string): string {
  if (!serialized) throw new TokenDecryptionError();
  try {
    const key = decodeKey(encodedKey);
    const parsed = payloadSchema.parse(JSON.parse(serialized));
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(parsed.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(parsed.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new TokenDecryptionError();
  }
}

export const encryptToken = encryptSecret;
export const decryptToken = decryptSecret;
