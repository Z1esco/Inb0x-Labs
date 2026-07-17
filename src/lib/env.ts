import { z } from "zod";

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalUrl = z.preprocess(blankToUndefined, z.url().optional());
const optionalString = z.preprocess(
  blankToUndefined,
  z.string().min(1).optional(),
);
const oauthStateSecret = z.preprocess(
  blankToUndefined,
  z
    .string()
    .min(32, "OAUTH_STATE_SECRET must be at least 32 characters")
    .optional(),
);
const tokenEncryptionKey = z.preprocess(
  blankToUndefined,
  z
    .string()
    .refine(
      (value) => Buffer.from(value, "base64").length === 32,
      "TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes",
    )
    .optional(),
);
const intWithDefault = (fallback: number, min: number, max: number) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(min).max(max).default(fallback),
  );
const booleanWithDefault = z.preprocess(
  blankToUndefined,
  z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
);

const environmentSchema = z
  .object({
    NEXT_PUBLIC_APP_URL: optionalUrl.default("http://localhost:3000"),
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_REDIRECT_URI: optionalUrl,
    OAUTH_STATE_SECRET: oauthStateSecret,
    TOKEN_ENCRYPTION_KEY: tokenEncryptionKey,
    OPENAI_API_KEY: optionalString,
    OPENAI_MODEL: optionalString,
    OPENAI_REASONING_EFFORT: z.preprocess(
      blankToUndefined,
      z
        .enum(["none", "minimal", "low", "medium", "high", "xhigh", "max"])
        .default("low"),
    ),
    OPENAI_TIMEOUT_MS: intWithDefault(30_000, 1_000, 120_000),
    OPENAI_MAX_RETRIES: intWithDefault(1, 0, 1),
    DEMO_MODE: booleanWithDefault,
    ANALYSIS_DAILY_LIMIT: intWithDefault(20, 1, 100),
    ANALYSIS_BATCH_LIMIT: intWithDefault(10, 1, 20),
    REPLY_DAILY_LIMIT: intWithDefault(20, 1, 100),
    GMAIL_LOOKBACK_DAYS: intWithDefault(30, 1, 365),
    GMAIL_MAX_THREADS: intWithDefault(50, 1, 100),
    THREAD_MAX_CHARACTERS: intWithDefault(12_000, 1_000, 50_000),
    DATA_RETENTION_HOURS: intWithDefault(24, 1, 720),
  })
  .superRefine((env, ctx) => {
    if (env.DEMO_MODE) return;
    const required = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ] as const;
    for (const key of required)
      if (!env[key])
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when DEMO_MODE=false`,
        });
  });

export type Environment = z.infer<typeof environmentSchema>;
export function parseEnvironment(
  source: Record<string, string | undefined>,
): Environment {
  return environmentSchema.parse(source);
}
export function getEnvironment(): Environment {
  return parseEnvironment(process.env);
}
