# OpenAI setup

Create an API project and server-side API key, add billing or credits if required, set a low project
budget, and choose a model available to that API project. ChatGPT subscriptions and API billing are
separate. Configure `OPENAI_API_KEY` and `OPENAI_MODEL`; no model name is hardcoded.

The implementation uses the official JavaScript SDK, Responses API, `responses.parse`, and
Zod-backed Structured Outputs. Timeouts and retries are configured with `OPENAI_TIMEOUT_MS` and
`OPENAI_MAX_RETRIES`. Demo mode needs no key and should be used for judging.

Never log the key, full prompts, email bodies, or draft bodies. Prompt versions live in
`src/prompts/versions.ts`; changing a prompt version intentionally invalidates the analysis cache.
