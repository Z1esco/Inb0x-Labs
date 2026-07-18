import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

const briefing = [
  ["01", "Approval needed", "Aurora proposal", "Critical"],
  ["02", "Reply expected", "Interview schedule", "Today"],
  ["03", "Payment due", "Invoice INV-1042", "20 Jul"],
] as const;

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="brand-lockup" href="/" aria-label="Inb0x home">
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
        <p className="landing-nav-note">A read-only attention workspace</p>
        <div className="landing-nav-actions">
          <Link className="button ghost" href="/login">
            Sign in
          </Link>
          <Link className="button primary" href="/dashboard">
            Open demo <Icon name="arrow" />
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-index" aria-hidden="true">
          <span>01</span>
          <span>Read</span>
          <i />
          <span>Decide</span>
          <i />
          <span>Act</span>
        </div>

        <div className="landing-copy">
          <p className="eyebrow">Inb0x Labs / Attention, deliberately edited</p>
          <h1>
            Your inbox,
            <br />
            <em>with judgment.</em>
          </h1>
          <p className="landing-lede">
            A private workspace that finds the consequential threads, preserves
            the evidence, and leaves every decision with you.
          </p>
          <div className="landing-actions">
            <Link className="button primary" href="/dashboard">
              Enter the workspace <Icon name="arrow" />
            </Link>
            <Link className="button secondary" href="/login">
              Connect Gmail safely
            </Link>
          </div>
          <div className="landing-trust">
            <span className="status-dot connected" />
            <span>Read-only Gmail</span>
            <span>No automatic replies</span>
            <span>No mailbox changes</span>
          </div>
        </div>

        <aside className="briefing-board" aria-label="Example daily briefing">
          <header>
            <div>
              <p className="eyebrow">Today / 09:41</p>
              <h2>Attention brief</h2>
            </div>
            <span className="brief-count">03</span>
          </header>
          <div className="briefing-list">
            {briefing.map(([rank, reason, subject, timing]) => (
              <article className="briefing-row" key={rank}>
                <span className="brief-rank">{rank}</span>
                <div>
                  <small>{reason}</small>
                  <strong>{subject}</strong>
                </div>
                <span>{timing}</span>
              </article>
            ))}
          </div>
          <footer>
            <span>12 threads scanned</span>
            <span>9 can wait</span>
          </footer>
        </aside>
      </section>

      <section className="landing-statement" aria-label="Product principle">
        <p>Not another inbox.</p>
        <strong>A decision layer above it.</strong>
      </section>

      <section className="landing-method">
        <header>
          <p className="eyebrow">The method</p>
          <h2>Signal is a sequence.</h2>
        </header>
        <div className="method-list">
          <article>
            <span>01</span>
            <h3>Reduce the field</h3>
            <p>Recent, relevant, read-only threads. Never the whole mailbox.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Show the evidence</h3>
            <p>
              Priority, deadlines, and actions remain grounded in the source.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Keep the human</h3>
            <p>
              Tasks require acceptance. Drafts remain copy-only. Nothing sends.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
