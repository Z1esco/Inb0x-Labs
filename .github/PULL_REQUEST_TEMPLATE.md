## Purpose and scope

What user problem does this change solve? Link any issue or approved design.

## Changes

- Main files/routes:
- Product behavior, API contract or migration impact (write "none" if none):
- Demo vs real-mode behavior:

## Trust and privacy review

- [ ] Gmail remains read-only; no send, Gmail drafts or mailbox mutations.
- [ ] Analysis/reply generation still requires explicit user action.
- [ ] Suggested tasks require explicit acceptance.
- [ ] No user email, secrets, provider tokens, prompts or private screenshots committed.
- [ ] Auth, RLS, ownership, quota and structured-output boundaries preserved.

## Verification (report actual outcomes)

- [ ] `npm run check` (include failures and reasons)
- [ ] Relevant Playwright / browser journey, if UI changed
- [ ] Loading, empty, error, partial, demo and disconnected states inspected
- [ ] Mobile, keyboard, reduced-motion and accessibility checks where relevant
- [ ] Diff reviewed for unrelated/generated files and secrets

## Screenshots

Attach redacted before/after images **only if UI changed**, or explain why unavailable.

## Release and approval

- [ ] Draft PR targets `develop` or an explicitly documented dependency branch
- [ ] No autonomous merge, provider changes, paid resources or production deployment
- Founder review: **pending**.
