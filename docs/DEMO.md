# Controlled beta demo

Set `DEMO_MODE=true`, run `npm ci` and `npm run dev`, then open `http://localhost:3000`.
No Gmail, Supabase, or OpenAI credential is needed. The fictional inbox includes urgent approval,
interview, invoice, meeting, security, newsletter, product update, design feedback, renewal,
promotion, long-thread, and prompt-injection examples.

Suggested flow: open Dashboard, inspect the urgent proposal, explicitly request analysis, follow
source evidence, accept a suggested task, prepare and copy a reply, complete a task, view Insights,
then reset from Settings. Prompt-injection fixtures exercise deterministic safety behavior; they
do not prove live-model robustness. Nothing is sent or changed in Gmail.

Demo mutations are shared per server process, ephemeral and fictional. Restarting the server resets
state. Do not enter private information or promise isolated persistent workspaces. Keep Preview access
protection enabled and provider secrets absent. The founder authorized automatic Preview builds only;
production promotion, DNS changes and real-mode provider setup remain separate approvals.
