# Cost controls

Demo mode has no Gmail or OpenAI cost. Supabase and Vercel can use available free tiers, subject
to current provider terms. OpenAI usage is the only intentional per-request model expense.

- Analysis and drafting require explicit user actions.
- Analysis caches by content hash and prompt version.
- Default daily limit: 20; batch limit: 10; Gmail sync limit: 50 threads.
- Thread input defaults to 12,000 characters; attachments are excluded.
- Model retries are capped at one; no embeddings, vector store, agents, cron, Redis, or paid monitoring.
- Usage events retain token counts without raw prompts or email content.

To prevent accidental spending, keep `DEMO_MODE=true` for judges, omit production keys from preview
deployments, set an OpenAI project budget/alert, choose an account-available model explicitly, and
reduce `ANALYSIS_DAILY_LIMIT` or `ANALYSIS_BATCH_LIMIT` when needed.
