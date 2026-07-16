# Judge demo

Set `DEMO_MODE=true`, run `npm install` and `npm run dev`, then open `http://localhost:3000`.
No Gmail, Supabase, or OpenAI credential is needed. The fictional inbox includes urgent approval,
interview, invoice, meeting, security, newsletter, product update, design feedback, renewal,
promotion, long-thread, and prompt-injection examples.

Suggested flow: open Dashboard, inspect the urgent proposal, view its analysis, generate a draft,
create and complete a task, view Insights, then reset from Settings. The attempted prompt injection
is flagged and ignored. Restarting the server also resets demo state.
