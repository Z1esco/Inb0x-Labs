# Controlled beta gates

Status: pre-release, 11 October 2026. Local synthetic tests and static review do not establish production readiness.

## Founder decisions

- Confirm public product/company naming, legal operator identity and a working private support/security contact. Do not reuse another product's contact without approval.
- Review Privacy Policy and Terms with appropriate advice: data controller/contact, processing purposes, Gmail permissions, OpenAI/Supabase subprocessors and transfer locations, retention, deletion/export limitations, consent withdrawal and applicable obligations. Policies are not yet approved or published; no compliance claim is made.
- Confirm whether the current MIT grant remains the intended licensing model. Do not change it silently.
- Approve a commercially eligible hosting plan and spending limits before any purchase or deployment.
- Approve Google consent submission, domain verification and any required restricted-scope assessment. `gmail.readonly` is a restricted scope; approval cannot be inferred from read-only access.

## Local release candidate

- [ ] `npm ci` and `npm run check` pass on the candidate SHA.
- [ ] Playwright demo journey, all-route viewport screenshots, keyboard, reduced motion and error recovery pass.
- [ ] Dependency findings are resolved or explicitly assessed; secret scan and source/diff review pass.
- [ ] No real credentials/content in screenshots, fixtures, logs or browser bundles.
- [ ] No mailbox mutations, background analysis, automatic task acceptance or reply sending.

## External verification before real users

- [ ] Rotation/revocation evidence for every historically exposed secret, current environment only.
- [ ] Disposable two-user Auth, RLS/grants, cross-user API denial, export and deletion checks.
- [ ] Dedicated Gmail account: consent, scope grant, callback, sync, disconnect/revocation; no writes or attachments.
- [ ] Explicit OpenAI calls, grounding, prompt-injection handling, bounded concurrency, cache and durable quota enforcement.
- [ ] Shared durable request-burst limiting; document demo's process-local/shared state.
- [ ] Verify retention behavior and disclosures; a configured age limit is not proof of a timed purge.
- [ ] HTTPS, security headers, redirects, logs, outage recovery, credential rotation and rollback rehearsal.
- [ ] Founder approves policies, billing limits, support channel, exact candidate SHA and deployment.

Keep demo preview and real-mode approval separate. A fictional preview must have `DEMO_MODE=true`, no provider secrets, no indexing, and no promise of private persistent demo storage. See [DOMAIN_DEPLOYMENT.md](DOMAIN_DEPLOYMENT.md).
