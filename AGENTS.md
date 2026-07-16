# Inb0x repository guidance

- Read and follow `PROJECT_RULES.md` first; it is the permanent project source of truth.
- Read `docs/IMPLEMENTATION_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/OWNERSHIP.md` first.
- Keep TypeScript strict; do not use `any` to bypass type safety.
- Use Server Components by default and create per-request server clients.
- Keep all secrets server-side. Never log private email content, tokens, prompts, drafts, cookies, or credentials.
- Gmail is read-only. Never add write permissions, email sending, mailbox mutations, attachment downloads, or automatic replies.
- Do not edit partner-owned visual files unless explicitly requested.
- Write tests for backend behavior and update public contracts when response shapes change.
- Update documentation after architecture or security changes.
- Run format, lint, typecheck, tests, and build after meaningful changes.
- Use conventional commits and keep the app deployable on Vercel.
- Preserve deterministic demo mode and ask before destructive changes.
