import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

export default function LandingPage() {
  return (
    <main className="hero-page">
      <header className="hero-nav">
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
        <div className="hero-nav-actions">
          <Link className="button ghost" href="/login">
            Sign in
          </Link>
          <Link className="button secondary" href="/dashboard">
            Open demo <Icon name="arrow" />
          </Link>
        </div>
      </header>
      <div className="hero-grid">
        <section className="hero-copy">
          <p className="eyebrow">A calm intelligence desk for email</p>
          <h1>
            Know what <em>deserves you.</em>
          </h1>
          <p>
            Inb0x reads the shape of a crowded inbox and returns a clear order
            of attention—without changing a single message.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/dashboard">
              Enter the demo <Icon name="arrow" />
            </Link>
            <Link className="button secondary" href="/login">
              Connect your workspace
            </Link>
          </div>
          <p className="hero-note">
            <span className="status-dot connected" /> No messages sent. No
            mailbox changes. Human control stays in the loop.
          </p>
        </section>
        <section className="hero-preview" aria-label="Inb0x product preview">
          <div className="preview-window">
            <div className="preview-sidebar">
              <span className="preview-brand">i0</span>
              {["01", "02", "03", "04", "05"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="preview-body">
              <div className="preview-heading">
                <div>
                  <span>Friday, 18 July</span>
                  <strong>Your attention, ordered.</strong>
                </div>
                <span className="preview-mode">Read-only</span>
              </div>
              <div className="preview-focus">
                <span className="preview-rank">01</span>
                <div>
                  <small>Needs a decision today</small>
                  <strong>Approve the launch proposal</strong>
                  <p>Budget confirmation requested before 4:00 PM.</p>
                </div>
                <span className="preview-time">12 min</span>
              </div>
              <div className="preview-list">
                <div>
                  <span>02</span>
                  <strong>Confirm interview schedule</strong>
                  <small>Reply expected</small>
                </div>
                <div>
                  <span>03</span>
                  <strong>Invoice reaches deadline</strong>
                  <small>Finance · Monday</small>
                </div>
                <div>
                  <span>04</span>
                  <strong>Review security alert</strong>
                  <small>Account activity</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <section className="landing-principles">
        <article>
          <p className="eyebrow">01 / Prioritize</p>
          <h2>Attention, ordered.</h2>
          <p className="muted">
            Deadlines, replies, and high-consequence threads rise above the
            noise.
          </p>
        </article>
        <article>
          <p className="eyebrow">02 / Decide</p>
          <h2>Context, intact.</h2>
          <p className="muted">
            Normalized message history and evidence keep every suggestion
            reviewable.
          </p>
        </article>
        <article>
          <p className="eyebrow">03 / Act</p>
          <h2>Control, preserved.</h2>
          <p className="muted">
            Tasks and copy-only drafts require your explicit confirmation before
            anything happens.
          </p>
        </article>
      </section>
    </main>
  );
}
