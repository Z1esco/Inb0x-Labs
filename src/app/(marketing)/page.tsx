import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

const previews = [
  ["01", "Priority inbox", "The threads that need a decision surface first."],
  [
    "02",
    "Thread signal",
    "Evidence, deadlines, and actions stay connected to source.",
  ],
  [
    "03",
    "Copy-only drafts",
    "A considered reply, ready for your review and copy.",
  ],
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark" aria-hidden="true">
            <Image
              src="/logo/inb0x-labs-logo.png"
              alt=""
              width={154}
              height={154}
              priority
            />
          </span>
          <span className="brand-wordmark">
            inb<span>0</span>x
          </span>
        </Link>
        <nav className="landing-links" aria-label="Marketing navigation">
          <a href="#product">Product</a>
          <a href="#method">Method</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <div className="hero-nav-actions">
          <Link className="button ghost" href="/login">
            Sign in
          </Link>
          <Link className="button secondary" href="/dashboard">
            View demo <Icon name="arrow" />
          </Link>
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="eyebrow">Inb0x Labs / Inbox zero, considered</p>
          <h1 id="landing-title">
            Your inbox has a <em>signal.</em>
          </h1>
          <p className="landing-lede">
            Inb0x turns crowded Gmail threads into a clear view of decisions,
            deadlines, tasks, and reply drafts—without changing your mailbox.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/login">
              Connect Gmail <Icon name="arrow" />
            </Link>
            <Link className="button secondary" href="/dashboard">
              Explore the demo
            </Link>
          </div>
          <p className="hero-note">
            <span className="status-dot connected" /> Read-only access. No
            auto-send. You stay in control.
          </p>
        </div>

        <div className="signal-window" aria-label="Priority inbox preview">
          <div className="signal-window-bar">
            <span>INB0X / FOCUS WINDOW</span>
            <span>09:42 MYT</span>
          </div>
          <div className="signal-window-grid">
            <aside className="signal-rail" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </aside>
            <section className="signal-content">
              <div className="signal-summary">
                <span>Attention required</span>
                <strong>04</strong>
                <small>Threads with a time-sensitive next step</small>
              </div>
              <article className="signal-thread critical">
                <span className="priority-rail critical" />
                <div>
                  <p>Northstar / 5:00 PM tomorrow</p>
                  <strong>Approval needed: Aurora proposal</strong>
                  <small>Decision requested · Source evidence available</small>
                </div>
                <Icon name="arrow" />
              </article>
              <article className="signal-thread">
                <span className="priority-rail medium" />
                <div>
                  <p>Arcadia / Friday, 10:30 AM</p>
                  <strong>Interview schedule confirmed</strong>
                  <small>Reply requested · Calendar detail detected</small>
                </div>
                <Icon name="chevron" />
              </article>
              <div className="signal-rhythm">
                <span>Inbox rhythm</span>
                <div aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section
        className="signal-transform"
        id="method"
        aria-labelledby="method-title"
      >
        <div>
          <p className="eyebrow">Noise becomes signal</p>
          <h2 id="method-title">A deliberate path through what arrived.</h2>
        </div>
        <div className="transform-flow">
          <div className="noise-bars" aria-label="Incoming email noise">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <Icon name="arrow" label="Organized into signal" />
          <div className="signal-bars" aria-label="Organized priority signal">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <p className="muted">
          Recent threads are read, normalized, and presented for review. Nothing
          is sent, archived, deleted, or changed.
        </p>
      </section>

      <section
        className="landing-method"
        id="product"
        aria-labelledby="product-title"
      >
        <div className="method-intro">
          <p className="eyebrow">The product, in sequence</p>
          <h2 id="product-title">
            From arrival to next action—without the inbox taking over.
          </h2>
        </div>
        <ol className="method-list">
          <li>
            <span>01</span>
            <div>
              <h3>Connect with read-only access</h3>
              <p>
                Gmail stays yours. Inb0x never requests permission to modify it.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Review priorities and evidence</h3>
              <p>
                Deadlines, decisions, and reply requests stay grounded in the
                thread.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Choose the next move</h3>
              <p>
                Create a task or copy a draft only when you explicitly decide to
                act.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section
        className="product-preview-section"
        aria-labelledby="preview-title"
      >
        <div className="section-heading">
          <p className="eyebrow">A focused workspace</p>
          <h2 id="preview-title">Each surface carries the context forward.</h2>
        </div>
        <div className="preview-grid">
          {previews.map(([number, title, copy]) => (
            <article className="product-preview-card" key={title}>
              <span>{number}</span>
              <div className="preview-geometry" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="privacy-section"
        id="privacy"
        aria-labelledby="privacy-title"
      >
        <div>
          <p className="eyebrow">Privacy by design</p>
          <h2 id="privacy-title">
            Useful only when it stays under your control.
          </h2>
        </div>
        <ul>
          <li>
            <Icon name="check" label="Confirmed" />
            <span>
              <strong>Read-only Gmail permission</strong>Inb0x cannot send,
              delete, archive, label, or mark messages read.
            </span>
          </li>
          <li>
            <Icon name="check" label="Confirmed" />
            <span>
              <strong>Review before copying</strong>Drafts are copy-only. There
              is no send action in Inb0x.
            </span>
          </li>
          <li>
            <Icon name="check" label="Confirmed" />
            <span>
              <strong>Disconnect anytime</strong>Mail connection is separate
              from your Inb0x session and remains your choice.
            </span>
          </li>
        </ul>
      </section>

      <section className="landing-cta">
        <p className="eyebrow">A calmer next step</p>
        <h2>Find the signal waiting in your inbox.</h2>
        <Link className="button primary" href="/login">
          Start with read-only access <Icon name="arrow" />
        </Link>
      </section>
      <footer className="landing-footer">
        <span>© 2026 Inb0x Labs</span>
        <div>
          <a href="#product">Product</a>
          <a href="#privacy">Privacy</a>
          <Link href="/login">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}
