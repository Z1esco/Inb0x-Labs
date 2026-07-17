import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

function readLocalEnvironment() {
  const values = {};

  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/u)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/u);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/gu, "");
  }

  return values;
}

function required(value, name) {
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function publicClient(url, anonKey, accessToken) {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

async function insertFixture(admin, userId, marker) {
  const now = new Date().toISOString();
  const contentHash = createHash("sha256")
    .update(`content-${marker}`)
    .digest("hex");
  const instructionsHash = createHash("sha256")
    .update(`instructions-${marker}`)
    .digest("hex");
  const { data: thread, error: threadError } = await admin
    .from("email_threads")
    .insert({
      user_id: userId,
      gmail_thread_id: `security-thread-${marker}`,
      subject: "Hosted isolation fixture",
      participants: ["fixture@example.test"],
      sender_names: ["Fixture Sender"],
      message_count: 1,
      latest_message_at: now,
      snippet: "Safe synthetic fixture",
      normalized_text: "Safe synthetic fixture content.",
      content_hash: contentHash,
      normalized_character_count: 31,
      messages: [],
      gmail_labels: ["INBOX"],
    })
    .select("id")
    .single();
  if (threadError) throw threadError;

  const { data: analysis, error: analysisError } = await admin
    .from("email_analyses")
    .insert({
      user_id: userId,
      email_thread_id: thread.id,
      content_hash: contentHash,
      prompt_version: "security-fixture-v1",
      schema_version: "security-fixture-v1",
      model: "fixture-model",
      summary: "Synthetic security verification result.",
      category: "other",
      priority_score: 10,
      priority_level: "low",
      priority_reason: "Synthetic fixture.",
      needs_reply: false,
      confidence: 1,
    })
    .select("id")
    .single();
  if (analysisError) throw analysisError;

  const inserts = [
    admin.from("tasks").insert({
      user_id: userId,
      title: "Synthetic isolation task",
      source: "manual",
      priority: "low",
    }),
    admin.from("reply_drafts").insert({
      user_id: userId,
      email_thread_id: thread.id,
      email_analysis_id: analysis.id,
      tone: "balanced",
      length: "medium",
      subject: "Synthetic draft",
      body: "Synthetic fixture only.",
      model: "fixture-model",
      prompt_version: "security-fixture-v1",
      schema_version: "security-fixture-v1",
      thread_content_hash: contentHash,
      instructions_hash: instructionsHash,
      confidence: 1,
    }),
    admin.from("usage_events").insert({
      user_id: userId,
      event_type: "security_fixture",
      metadata: { synthetic: true },
    }),
    admin.from("rate_limits").insert({
      user_id: userId,
      action: `security_fixture_${marker}`,
      window_started_at: now,
    }),
    admin.from("gmail_connections").insert({
      user_id: userId,
      google_subject: `synthetic-${marker}`,
      gmail_address: `synthetic-${marker}@example.test`,
      encrypted_access_token: "synthetic-encrypted-access-token",
      encrypted_refresh_token: "synthetic-encrypted-refresh-token",
      granted_scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    }),
  ];

  const results = await Promise.all(inserts);
  const failure = results.find((result) => result.error)?.error;
  if (failure) throw failure;

  return {
    analysisId: analysis.id,
    taskMarker: "Synthetic isolation task",
    threadId: thread.id,
  };
}

async function signIn(url, anonKey, email, password) {
  const client = publicClient(url, anonKey);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session)
    throw error ?? new Error("Missing disposable test session");
  return publicClient(url, anonKey, data.session.access_token);
}

async function verifyUserIsolation(client, ownId, otherId) {
  const tables = [
    ["profiles", "id"],
    ["user_settings", "user_id"],
    ["email_threads", "user_id"],
    ["email_analyses", "user_id"],
    ["tasks", "user_id"],
    ["reply_drafts", "user_id"],
    ["usage_events", "user_id"],
    ["rate_limits", "user_id"],
  ];

  for (const [table, ownerColumn] of tables) {
    const own = await client
      .from(table)
      .select(ownerColumn)
      .eq(ownerColumn, ownId);
    const other = await client
      .from(table)
      .select(ownerColumn)
      .eq(ownerColumn, otherId);
    assert(
      !own.error && own.data.length > 0,
      `${table}: own row was not readable`,
    );
    assert(
      !other.error && other.data.length === 0,
      `${table}: cross-user row was readable`,
    );
  }

  for (const table of ["gmail_connections", "oauth_states"]) {
    const result = await client.from(table).select("*").limit(1);
    assert(
      Boolean(result.error),
      `${table}: credential data was browser-readable`,
    );
  }

  const crossInsert = await client.from("tasks").insert({
    user_id: otherId,
    title: "Forbidden cross-user insert",
    source: "manual",
    priority: "low",
  });
  assert(
    Boolean(crossInsert.error),
    "Cross-user insert unexpectedly succeeded",
  );

  const ownUpdate = await client
    .from("tasks")
    .update({ title: "Forbidden browser update" })
    .eq("user_id", ownId);
  assert(
    Boolean(ownUpdate.error),
    "Direct browser update unexpectedly succeeded",
  );

  const ownDelete = await client.from("tasks").delete().eq("user_id", ownId);
  assert(
    Boolean(ownDelete.error),
    "Direct browser delete unexpectedly succeeded",
  );

  const malformed = await client
    .from("tasks")
    .select("id")
    .eq("user_id", "not-a-uuid");
  assert(Boolean(malformed.error), "Malformed owner ID was not rejected");

  const guessed = await client
    .from("tasks")
    .select("id")
    .eq("user_id", randomUUID());
  assert(
    !guessed.error && guessed.data.length === 0,
    "Guessed owner ID disclosed rows",
  );

  const rpc = await client.rpc("reserve_analysis_usage", {
    p_user_id: otherId,
    p_daily_limit: 1,
    p_model: "fixture-model",
    p_metadata: {},
  });
  assert(
    Boolean(rpc.error),
    "Authenticated browser unexpectedly executed privileged RPC",
  );
}

async function main() {
  const env = { ...readLocalEnvironment(), ...process.env };
  const url = required(
    env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  const anonKey = required(
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  const serviceKey = required(
    env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const marker = randomUUID();
  const accounts = [
    {
      email: `release-a-${marker}@example.test`,
      password: randomBytes(32).toString("base64url"),
      userId: null,
    },
    {
      email: `release-b-${marker}@example.test`,
      password: randomBytes(32).toString("base64url"),
      userId: null,
    },
  ];

  try {
    for (const account of accounts) {
      const { data, error } = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
      });
      if (error) throw error;
      account.userId = data.user.id;
    }

    await Promise.all([
      insertFixture(admin, accounts[0].userId, "a"),
      insertFixture(admin, accounts[1].userId, "b"),
    ]);

    const [clientA, clientB] = await Promise.all([
      signIn(url, anonKey, accounts[0].email, accounts[0].password),
      signIn(url, anonKey, accounts[1].email, accounts[1].password),
    ]);

    await Promise.all([
      verifyUserIsolation(clientA, accounts[0].userId, accounts[1].userId),
      verifyUserIsolation(clientB, accounts[1].userId, accounts[0].userId),
    ]);

    const anonymous = publicClient(url, anonKey);
    const anonymousRead = await anonymous
      .from("profiles")
      .select("id")
      .limit(1);
    assert(
      Boolean(anonymousRead.error),
      "Anonymous application-table read unexpectedly succeeded",
    );

    const expiredPayload = Buffer.from(
      JSON.stringify({ exp: 1, role: "authenticated", sub: randomUUID() }),
    ).toString("base64url");
    const expired = publicClient(
      url,
      anonKey,
      `eyJhbGciOiJIUzI1NiJ9.${expiredPayload}.invalid`,
    );
    const expiredRead = await expired.from("profiles").select("id").limit(1);
    assert(
      Boolean(expiredRead.error),
      "Expired or invalid session unexpectedly read protected data",
    );

    console.log(
      JSON.stringify({
        anonymousAccess: "blocked",
        credentialTables: "blocked",
        directMutations: "blocked",
        disposableUsers: 2,
        expiredSession: "blocked",
        rpcAccess: "blocked",
        testedDataClasses: 8,
        userAIsolation: "passed",
        userBIsolation: "passed",
      }),
    );
  } finally {
    for (const account of accounts) {
      if (account.userId) await admin.auth.admin.deleteUser(account.userId);
    }
  }
}

await main();
