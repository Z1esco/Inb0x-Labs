import type { Metadata } from "next";
import Link from "next/link";
import { EmailWalkthrough } from "@/components/email-walkthrough";
import { Icon } from "@/components/icons";
import { MarketingHeader } from "@/components/marketing-header";
import { ProductPreview } from "@/components/product-preview";
import "./marketing.css";

export const metadata: Metadata = {
  title: "Inb0x Labs — Make room for what needs you",
  description:
    "Turn email threads into summaries, source-linked decisions, tasks you accept and replies you review. Explore the fictional demo. Gmail stays read-only.",
};

export default function LandingPage() {
  return (
    <div className="product-site">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <MarketingHeader />
      <main id="main-content" tabIndex={-1}>
        <section
          className="site-hero site-container"
          aria-labelledby="landing-title"
        >
          <h1 id="landing-title">
            Make room for
            <br /> what needs you.
          </h1>
          <p>
            Email holds decisions, deadlines and requests.
            <br className="hero-linebreak" /> Inb0x brings them into focus. You
            decide what happens next.
          </p>
          <div className="site-cta-row">
            <Link className="desk-button desk-button-ink" href="/dashboard">
              Open the demo <Icon name="arrow" />
            </Link>
            <a className="site-secondary-action" href="#method">
              See how it works <Icon name="chevron" />
            </a>
          </div>
          <p className="hero-reassurance">
            <Icon name="check" /> Try fictional email. No Google connection
            needed.
          </p>
          <ProductPreview />
        </section>

        <section className="site-problem site-container">
          <h2>
            The work is in your email.
            <br /> The inbox makes you look for it.
          </h2>
          <p>
            A request buried in a long reply. A date you meant to remember. A
            conversation waiting for a decision. Bring the important pieces
            together, with the source close at hand.
          </p>
        </section>

        <section
          className="site-method site-container"
          id="method"
          aria-labelledby="method-title"
        >
          <div className="site-section-intro">
            <h2 id="method-title">
              From a conversation
              <br /> to a clear next step.
            </h2>
            <p>
              Read the original. Understand the finding. Choose the action.
              Follow one email through the process.
            </p>
          </div>
          <EmailWalkthrough />
        </section>

        <section
          className="site-evidence-band"
          aria-labelledby="evidence-title"
        >
          <div className="site-container site-evidence-layout">
            <div className="site-evidence-copy">
              <h2 id="evidence-title">
                Understanding,
                <br /> with something
                <br /> to back it up.
              </h2>
              <p>
                AI summaries are a starting point for your judgment. Priorities,
                proposed actions and dates remain connected to the message they
                came from.
              </p>
              <Link className="site-text-link" href="/inbox/proposal-approval">
                Read a thread in the demo <Icon name="arrow" />
              </Link>
            </div>
            <div className="evidence-reading">
              <h3>What deserves a closer look?</h3>
              <dl>
                <div>
                  <dt>
                    <Icon name="activity" /> Priorities & categories
                  </dt>
                  <dd>
                    See why a conversation needs attention and where it fits.
                  </dd>
                </div>
                <div>
                  <dt>
                    <Icon name="clock" /> Deadlines & meetings
                  </dt>
                  <dd>
                    Review the detected date, timezone, confidence and source
                    wording.
                  </dd>
                </div>
                <div>
                  <dt>
                    <Icon name="search" /> Source evidence
                  </dt>
                  <dd>
                    Jump from a finding back to its original message. Unknowns
                    stay visible.
                  </dd>
                </div>
              </dl>
              <p>
                <Icon name="warning" /> AI can miss context. Verify important
                details before acting.
              </p>
            </div>
          </div>
        </section>

        <section
          className="site-reply site-container"
          aria-labelledby="reply-title"
        >
          <div className="reply-example">
            <div className="reply-example-header">
              <Icon name="copy" />
              <strong>Reply Studio</strong>
              <span>Illustrative draft</span>
            </div>
            <blockquote>
              Thanks for sharing the proposal. I’ll review it and get back to
              you before the deadline.
            </blockquote>
            <p>Review commitments and facts before copying.</p>
            <div className="reply-example-footer">
              <span>
                <Icon name="check" /> Copy-only
              </span>
              <span>Nothing sent</span>
            </div>
          </div>
          <div className="site-reply-copy">
            <h2 id="reply-title">
              Find the words.
              <br /> Keep the final say.
            </h2>
            <p>
              Choose the tone and length. Generate a reply when you need one,
              then review its facts, confidence and warnings. Copy the wording
              into your email client when you’re ready.
            </p>
            <ul>
              <li>Direct, balanced, warm or professional tone</li>
              <li>Short, medium or detailed replies</li>
              <li>Used facts and uncertainty shown alongside</li>
            </ul>
            <Link className="site-text-link" href="/inbox/proposal-approval">
              Try preparing a reply <Icon name="arrow" />
            </Link>
          </div>
        </section>

        <section
          className="site-patterns site-container"
          aria-labelledby="patterns-title"
        >
          <div>
            <h2 id="patterns-title">
              A little perspective
              <br /> on the bigger picture.
            </h2>
            <p>
              See thread volume, categories and priorities. Keep accepted tasks
              and saved replies in view. Insights describe your stored workspace
              so you can understand what the numbers mean.
            </p>
          </div>
          <div className="patterns-directory">
            <Link href="/tasks">
              <Icon name="tasks" />
              <div>
                <strong>Work you chose to own</strong>
                <span>Accept, complete and reopen tasks.</span>
              </div>
              <Icon name="arrow" />
            </Link>
            <Link href="/insights">
              <Icon name="trend" />
              <div>
                <strong>Patterns you can explain</strong>
                <span>Volume and distribution, with context.</span>
              </div>
              <Icon name="arrow" />
            </Link>
            <Link href="/settings">
              <Icon name="settings" />
              <div>
                <strong>A workspace you control</strong>
                <span>Usage, connection and data preferences.</span>
              </div>
              <Icon name="arrow" />
            </Link>
          </div>
        </section>

        <section
          className="site-trust-band"
          id="boundary"
          aria-labelledby="boundary-title"
        >
          <div className="site-container site-trust-layout">
            <div>
              <h2 id="boundary-title">Your inbox stays yours.</h2>
              <p>
                Google sign-in and Gmail authorization are separate. Connect
                read-only Gmail access when you choose; disconnect it from
                Settings.
              </p>
              <Link className="site-text-link" href="/login">
                Understand the permissions <Icon name="arrow" />
              </Link>
            </div>
            <dl className="site-permission-ledger">
              <div>
                <dt>Read email</dt>
                <dd>Only with your Gmail authorization and explicit sync.</dd>
              </div>
              <div>
                <dt>Analyze or draft</dt>
                <dd>Only when you request it. Quotas and usage are visible.</dd>
              </div>
              <div>
                <dt>Send or change Gmail</dt>
                <dd>
                  Never. No sending, archiving, deleting or label changes.
                </dd>
              </div>
              <div>
                <dt>Control your data</dt>
                <dd>
                  Export and deletion controls in Settings; review their stated
                  limits.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          className="site-questions site-container"
          aria-labelledby="questions-title"
        >
          <h2 id="questions-title">Before you begin.</h2>
          <div>
            <details>
              <summary>
                Can I try it without connecting Gmail?
                <Icon name="plus" />
              </summary>
              <p>
                Yes. The demo uses fictional, deterministic email and needs no
                provider credentials. It is shared and temporary, so don’t enter
                private information there.
              </p>
            </details>
            <details>
              <summary>
                Does Inb0x send email or create Gmail drafts?
                <Icon name="plus" />
              </summary>
              <p>
                No. Reply Studio prepares copy-only text. You review it, copy it
                and send from your own email client if you choose.
              </p>
            </details>
            <details>
              <summary>
                When does AI processing happen?
                <Icon name="plus" />
              </summary>
              <p>
                When you explicitly request thread analysis or prepare a reply.
                Opening a page does not start background AI processing.
              </p>
            </details>
            <details>
              <summary>
                Can I trust every deadline or suggestion?
                <Icon name="plus" />
              </summary>
              <p>
                AI output can be incomplete or wrong. Review confidence,
                warnings and source evidence, especially dates, timezones and
                commitments. Suggestions only become tasks when you accept them.
              </p>
            </details>
          </div>
        </section>

        <section className="site-final-cta site-container">
          <h2>
            Give the important
            <br /> work some room.
          </h2>
          <p>Start with a fictional workspace. Explore at your own pace.</p>
          <div className="site-cta-row">
            <Link className="desk-button desk-button-ink" href="/dashboard">
              Open the demo <Icon name="arrow" />
            </Link>
            <Link className="site-secondary-action" href="/login">
              Sign in to your workspace
            </Link>
          </div>
        </section>
      </main>
      <footer className="site-footer site-container">
        <div>
          <Link className="site-footer-brand" href="/">
            Inb0x Labs
          </Link>
          <p>Email, edited into decisions.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#product">Product</a>
          <a href="#boundary">Privacy & controls</a>
          <Link href="/login">Sign in</Link>
          <a href="https://github.com/Z1esco/Inb0x-Labs">
            Project & documentation
          </a>
        </nav>
        <p className="site-footer-note">
          Inbox Zero AI by Inb0x Labs. A pre-release product; demo content is
          fictional.
        </p>
      </footer>
    </div>
  );
}
