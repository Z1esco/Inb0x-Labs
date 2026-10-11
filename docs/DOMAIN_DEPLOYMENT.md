# Inb0x Labs · Domain and deployment runbook

**Domain:** `inb0x.my` · **Registrar:** Exabytes · **Status as of 11 October 2026:** acquired by founder; this document does not assert live DNS resolution, HTTPS readiness, hosting or public deployment.

## Recommended architecture

- Canonical public address after launch: `https://inb0x.my`.
- Optional `https://www.inb0x.my` should redirect to the canonical address.
- Next.js application deployed on a **commercially eligible** hosting plan, such as an appropriate Vercel plan.
- Continue using Supabase for identity/data and the existing read-only Gmail Google OAuth boundary.
- Keep the demo publicly safe and fictional until live-provider checks pass.

## Cutover checklist (manual, founder-approved)

1. Confirm domain ownership in Exabytes, current nameservers and whether DNS is hosted by Exabytes or a delegated provider.
2. Export or record **all** current DNS records, particularly MX, TXT/SPF, DKIM and DMARC. Do not delete records that serve future domain email.
3. Create an approved hosting project and deploy the reviewed application to a temporary preview address in `DEMO_MODE=true`.
4. Inside the actual hosting project's domain screen add `inb0x.my` and optional `www.inb0x.my`. **Copy the exact A/AAAA/CNAME records shown there**; values depend on provider/project and must not be guessed.
5. Update the correct authoritative DNS zone at Exabytes or the delegated nameserver provider. Never assume registrar and DNS provider are identical.
6. Wait for resolver propagation, verify apex and www against the host's records, check automatic HTTPS certificate issuance, TLS chain and redirects.
7. Set `NEXT_PUBLIC_APP_URL=https://inb0x.my` and update all configured Google OAuth authorized redirect URIs and Supabase site/redirect allowlists to the exact production host **only after deployment approval**. Gmail callback route: `https://inb0x.my/api/gmail/callback`; Supabase application callback: `https://inb0x.my/auth/callback`. Verify actual routes before provider edits.
8. Run smoke tests for landing/login, demo, auth, session cookies, API errors and mobile layouts. Keep real Gmail disconnected until dedicated-account consent and permission testing passes.
9. Verify no secrets in client bundles, no unintentional `robots`/metadata indexing of protected content, and no logs containing email bodies or drafts.
10. Record date, DNS values, provider, verification evidence and rollback steps in a release report. Founder approves public launch.

## Operational constraints

- **Do not buy hosting, transfer nameservers, change DNS, deploy, configure Google Cloud or link Supabase secrets autonomously.**
- **Do not treat domain acquisition as public application availability.**
- Review platform terms/pricing: Vercel Hobby has non-commercial restrictions; use a plan eligible for the intended SaaS.
- The product stays read-only with on-demand AI and copy-only drafts.
- Google restricted Gmail scopes can require OAuth verification and further provider assessments before broad real-user availability. Do not claim approval until confirmed.

## Provider setup after explicit approval

Keep the two OAuth flows separate:

| Console                                  | Required configuration                                                                                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Cloud: application sign-in client | Copy the exact Supabase project's callback from its Google provider screen, normally `https://<project-ref>.supabase.co/auth/v1/callback`, into this client's authorized redirect URIs. The app's `/auth/callback` is the next hop, not Google's Supabase callback. |
| Supabase: Auth URL Configuration         | Set Site URL to the approved origin and allow the exact `https://inb0x.my/auth/callback`. Use only deliberately approved preview URLs; avoid broad production wildcards.                                                                                            |
| Google Cloud: dedicated Gmail client     | Set `GOOGLE_REDIRECT_URI=https://inb0x.my/api/gmail/callback` and authorize that exact URI. Keep Gmail consent separate from app sign-in. Request only the existing identity and `gmail.readonly` scopes.                                                           |
| Google Auth Platform                     | Configure operator details, verified domain, published privacy/terms links and dedicated test users. Determine restricted-scope verification and assessment requirements before opening beta.                                                                       |
| Vercel: environment variables            | Demo preview: `DEMO_MODE=true`, exact preview `NEXT_PUBLIC_APP_URL`, no provider credentials. Real mode requires the environment-specific variables in ENVIRONMENT.md, reviewed secrets, and hosted verification. Redeploy only after approval.                     |

In Exabytes, open the domain's DNS management only if it is authoritative. Save the existing zone,
then add only the hostnames and exact record values provided by the approved Vercel project. If
delegated elsewhere, use that provider's zone. Do not change nameservers or email records. Configure
the optional www redirect in Vercel after ownership and HTTPS verification; do not add a hardcoded
application redirect that would break localhost or previews.

Before cutover, record the prior hosting deployment and DNS values. Roll back application traffic
to the previously approved deployment; restore only records changed in this cutover if DNS rollback
is necessary. Application rollback does not undo database migrations. See RELEASE_RUNBOOK.md.

## Plan and consent references

Reviewed on 11 October 2026: Vercel's [fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
restrict Hobby to non-commercial personal use; commercial use requires Pro or Enterprise. Pro is the
candidate for this SaaS, subject to founder billing approval and a fresh review of usage/spending controls.
No plan was purchased or connected. Google's [scope documentation](https://developers.google.com/workspace/gmail/api/auth/scopes)
classifies `gmail.readonly` as restricted. Follow Supabase's [Google sign-in guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
for the separate identity flow. These references do not establish account eligibility or consent approval.

## Verification examples (run locally after records are set)

```bash
nslookup inb0x.my
nslookup www.inb0x.my
curl -I https://inb0x.my
curl -I https://www.inb0x.my
```

Success requires expected DNS answers, valid HTTPS and the intended redirect. These commands are instructions, not completed verification.
