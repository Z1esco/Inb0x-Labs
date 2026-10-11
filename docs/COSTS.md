# Cost controls

Demo fixtures make no Gmail or OpenAI calls. Hosting and database usage still depend on provider
plans and limits. Commercial Vercel use requires an eligible plan; Hobby is restricted to personal
non-commercial use. See the reviewed terms in DOMAIN_DEPLOYMENT.md. No plan purchase is authorized.

- Analysis and drafting require explicit user actions.
- Analysis caches by content hash and prompt version; drafts additionally cache by tone, length, and
  instructions hash.
- Default analysis and reply daily limits: 20 each; batch limit: 10; Gmail sync limit: 50 threads.
- Thread input defaults to 12,000 characters; attachments are excluded.
- Model retries are capped at one; no embeddings, vector store, agents, cron, Redis, or paid monitoring.
- Usage events retain token counts without raw prompts or email content.

To prevent accidental spending, keep `DEMO_MODE=true` for fictional previews, omit production keys from preview
deployments, set an OpenAI project budget/alert, choose an account-available model explicitly, and
reduce `ANALYSIS_DAILY_LIMIT`, `ANALYSIS_BATCH_LIMIT`, or `REPLY_DAILY_LIMIT` when needed.

Provider budget alerts are not guaranteed hard spending caps. Daily persisted AI quotas and
process-local burst limits have different scopes; shared durable burst limiting remains a real-user
release gate. Verify concurrency and billing controls in a dedicated environment before real mode.
