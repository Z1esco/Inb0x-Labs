# 🛡️ Security Policy

Security and privacy are core requirements for Inb0x. The application processes
sensitive email data, so reports that help protect users are taken seriously and
handled through coordinated disclosure.

## 📌 Supported versions

Inb0x is currently in pre-release development. Security fixes are applied to the
latest code on the `main` branch.

| Version                        | Supported |
| ------------------------------ | :-------: |
| Latest `main` branch           |    ✅     |
| Older commits and forks        |    ❌     |
| Unreleased local modifications |    ❌     |

This table will be updated when versioned releases become available.

## 🚨 Reporting a vulnerability

**Please do not open a public GitHub issue for a suspected security vulnerability.**

Use the repository's private reporting channel:

1. Visit the [Inb0x Labs security page](https://github.com/Z1esco/Inb0x-Labs/security).
2. Select **Report a vulnerability** under **Private vulnerability reporting**.
3. Include the information requested below.

If private vulnerability reporting is not available, contact the repository owner
through their [GitHub profile](https://github.com/Z1esco) and request a private
communication channel. Do not include exploit details or sensitive user data in a
public message.

### What to include

- A clear description of the vulnerability and its potential impact.
- The affected route, component, commit, or configuration.
- Reproduction steps or a minimal proof of concept.
- Required conditions, permissions, or account state.
- Relevant logs or screenshots with secrets and personal data removed.
- Any suggested mitigation, if known.
- A safe way to contact you for follow-up.

Please never include real Gmail messages, OAuth tokens, API keys, passwords,
session cookies, or other people's personal information in a report.

## ⏱️ Response process

The maintainers aim to:

| Stage                         | Target                                           |
| ----------------------------- | ------------------------------------------------ |
| Acknowledge the report        | Within 3 business days                           |
| Provide an initial assessment | Within 7 business days                           |
| Share remediation progress    | At least every 14 days while active              |
| Coordinate disclosure         | After a fix is available and users are protected |

These are best-effort targets for a small hackathon team. Complex reports or external
provider dependencies may require additional time. Reporters will be informed when
timelines materially change.

## 🤝 Responsible disclosure guidelines

We ask security researchers to:

- make a good-faith effort to avoid privacy violations and service disruption;
- test only with accounts and data they own or have explicit permission to use;
- stop testing and report immediately if they encounter another user's data;
- use the minimum access needed to demonstrate the issue;
- avoid denial-of-service testing, automated high-volume scanning, and social engineering;
- avoid modifying or deleting data, sending email, or changing Gmail mailbox state;
- allow reasonable time for remediation before public disclosure;
- comply with applicable laws and third-party platform policies.

We will make a good-faith effort to work constructively with researchers who follow
these guidelines. This policy is not a bug bounty program and does not promise payment.

## 🎯 Security scope

Reports are especially valuable when they involve:

- authentication or authorization bypass;
- cross-user data access or insecure direct object references;
- OAuth state validation, redirect handling, or token leakage;
- exposure of Gmail, Supabase, Google, or OpenAI credentials;
- stored or reflected cross-site scripting from email content;
- SQL injection or Row Level Security policy bypass;
- prompt injection that crosses an application security boundary;
- unauthorized Gmail permissions or mailbox mutations;
- server-side request forgery, remote code execution, or privilege escalation;
- sensitive information exposed through logs, errors, builds, or client bundles;
- rate-limit bypass that creates material abuse or unexpected API spending;
- failure of account disconnection or user-data deletion.

The following are generally out of scope unless they create a demonstrated security impact:

- missing best-practice headers without a working exploit;
- self-XSS that cannot affect another user;
- clickjacking on pages without sensitive actions;
- reports produced only by automated scanners without validation;
- dependency version reports without a reachable vulnerable path;
- denial-of-service or high-volume load testing;
- social engineering, phishing, or physical attacks;
- vulnerabilities in third-party services that do not arise from Inb0x configuration or code;
- hypothetical AI output concerns without a reproducible boundary violation.

## 🔐 Security principles

### Gmail access

Inb0x uses least-privilege, read-only Gmail access. The MVP must never request
`gmail.modify`, `gmail.compose`, `gmail.send`, or `mail.google.com` scopes. It does
not send, delete, archive, mark as read, relabel, or otherwise modify email.

### Secrets and OAuth tokens

- Provider tokens are encrypted before database storage using authenticated encryption.
- OAuth state is cryptographically random, validated, expiring, and single-use.
- Secrets and service-role credentials remain server-side.
- Tokens, cookies, API keys, raw prompts, and private email bodies must not be logged.
- Disconnecting Gmail removes local tokens even if remote revocation fails.

### Data isolation and retention

- Every user-owned database table is protected by Row Level Security.
- Server routes derive identity from the authenticated session, not client-supplied IDs.
- Stored email content is minimized and removed according to the configured retention period.
- Users can disconnect Gmail and request deletion of their stored Inb0x data.

### Untrusted email and AI output

- Email HTML is sanitized and converted to safe plain text.
- Attachments are detected but never downloaded or processed in the MVP.
- Email text is treated as untrusted data, never as application instructions.
- Structured model output is validated before it is stored or returned.
- AI summaries and drafts are assistive suggestions, not guaranteed facts.
- Reply drafts are never sent automatically and require manual user action outside Inb0x.

## 🧩 Threat model summary

| Threat                        | Primary control                                                            |
| ----------------------------- | -------------------------------------------------------------------------- |
| Stolen refresh token          | Server-only authenticated encryption and immediate local deletion          |
| OAuth CSRF                    | Strong state values, secure cookies, expiration, and single-use validation |
| Session theft                 | Secure session handling and server-side authorization checks               |
| Cross-user access             | Supabase RLS plus ownership checks in service and API layers               |
| Malicious email HTML          | Sanitization, plain-text normalization, and no script execution            |
| Prompt injection in email     | Explicit trust boundary, strict prompts, schemas, and output validation    |
| Oversized email content       | Configurable thread limits and normalization caps                          |
| API abuse and unexpected cost | Per-user rate limits, daily quotas, caching, and bounded retries           |
| Sensitive logs                | Structured allowlisted logging with content and secret redaction           |
| Accidental Gmail mutation     | Read-only scopes and no write or send implementation                       |
| Model hallucination           | Evidence requirements, confidence values, and user review                  |
| Duplicate or racing writes    | Database constraints and idempotent service operations                     |

## 🧑‍💻 Guidance for contributors

Before submitting a security-sensitive change:

- keep TypeScript strict and validate every external input;
- preserve read-only Gmail scopes and avoid mailbox write code;
- keep secrets out of `NEXT_PUBLIC_*` variables and client bundles;
- add tests for authentication, authorization, encryption, and failure paths;
- return safe error messages without stack traces or provider internals;
- update this policy and the detailed threat model when security behavior changes;
- run formatting, linting, type checks, tests, and the production build.

Never commit `.env` files, Google client-secret JSON files, provider tokens, database
service keys, or real email fixtures. If a secret is accidentally exposed, revoke and
rotate it immediately; removing it from the latest commit is not sufficient.

## 📚 Additional documentation

As the implementation lands, detailed operational guidance will be maintained in:

- `docs/SECURITY.md` — application threat model and implemented controls;
- `docs/SETUP.md` — secure local and production configuration;
- `docs/GOOGLE_OAUTH.md` — OAuth scopes, redirect URIs, and credential handling;
- `docs/DATABASE.md` — table ownership and Row Level Security policies.

---

Thank you for helping keep Inb0x and its users safe. 💙
