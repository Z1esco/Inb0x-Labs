import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

export default function LandingPage() {
  return (
    <main className="hero-page">
      <header className="hero-nav">
        <Link className="brand-lockup" href="/">
          <Image
            src="/logo/inb0x-labs-logo.png"
            alt="Inb0x Labs"
            width={32}
            height={32}
            priority
          />
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
          <p className="eyebrow">Inb0x Labs / read-only intelligence</p>
          <h1>
            Noise becomes <em>signal.</em>
          </h1>
          <p>
            Inb0x turns a crowded Gmail into a deliberate action plan: what
            matters, what can wait, and what deserves your next ten minutes.
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
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
            </div>
            <div className="preview-body">
              <div className="preview-kicker" />
              <div className="preview-title" />
              <div className="preview-metrics">
                <div />
                <div />
                <div />
              </div>
              <div className="preview-chart" />
              <div className="preview-row" />
              <div className="preview-row" />
            </div>
          </div>
        </section>
      </div>
      <section
        className="data-grid"
        style={{ maxWidth: 1440, margin: "0 auto" }}
      >
        <article className="surface surface-pad">
          <p className="eyebrow">01 / Prioritize</p>
          <h2>Attention, ordered.</h2>
          <p className="muted">
            Deadlines, replies, and high-consequence threads rise above the
            noise.
          </p>
        </article>
        <article className="surface surface-pad">
          <p className="eyebrow">02 / Decide</p>
          <h2>Context, intact.</h2>
          <p className="muted">
            Normalized message history and evidence keep every suggestion
            reviewable.
          </p>
        </article>
        <article className="surface surface-pad">
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
