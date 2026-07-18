import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

const decisions = [
  {
    number: "01",
    label: "Decision",
    subject: "Approve the Aurora proposal",
    detail: "Morgan needs a decision before 5:00 PM tomorrow.",
    state: "Now",
  },
  {
    number: "02",
    label: "Reply",
    subject: "Confirm the interview schedule",
    detail: "A direct response is expected for Thursday at 10:30.",
    state: "Today",
  },
  {
    number: "03",
    label: "Deadline",
    subject: "Invoice INV-1042",
    detail: "Payment is due July 20; evidence remains attached to the thread.",
    state: "20 Jul",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="editorial-landing">
      <header className="landing-masthead">
        <Link className="landing-brand" href="/" aria-label="Inb0x home">
          <Image
            src="/logo/inb0x-labs-logo.png"
            alt=""
            width={44}
            height={44}
            priority
          />
          <span>INB0X</span>
        </Link>
        <span className="landing-edition">
          Private attention desk · Edition 01
        </span>
        <nav aria-label="Marketing navigation">
          <a href="#method">Method</a>
          <a href="#boundary">Privacy</a>
          <Link href="/login">Sign in</Link>
        </nav>
      </header>

      <section className="landing-opening" aria-labelledby="landing-title">
        <div className="landing-opening-copy">
          <span className="issue-number">ISSUE / 001</span>
          <h1 id="landing-title">
            Email,
            <br />
            edited into
            <br />
            <em>decisions.</em>
          </h1>
          <p>
            Inb0x reads the recent threads you permit, finds the work inside
            them, and gives you a quieter place to decide what happens next.
          </p>
          <div className="landing-cta-row">
            <Link className="desk-button desk-button-ink" href="/dashboard">
              Open the demo <Icon name="arrow" />
            </Link>
            <Link className="text-action" href="/login">
              Connect your own workspace
            </Link>
          </div>
        </div>

        <div className="attention-proof" aria-label="Example attention brief">
          <header>
            <div>
              <span>Thursday · 09:41</span>
              <h2>Your attention brief</h2>
            </div>
            <strong>3 / 12</strong>
          </header>
          <ol>
            {decisions.map((item) => (
              <li key={item.number}>
                <span>{item.number}</span>
                <div>
                  <small>{item.label}</small>
                  <strong>{item.subject}</strong>
                  <p>{item.detail}</p>
                </div>
                <time>{item.state}</time>
              </li>
            ))}
          </ol>
          <footer>
            <span>9 threads can wait</span>
            <span>Gmail remains unchanged</span>
          </footer>
        </div>
      </section>

      <section className="landing-thesis" aria-label="Product principle">
        <span>Not an inbox replacement.</span>
        <p>A considered layer between correspondence and action.</p>
      </section>

      <section className="landing-method" id="method">
        <header>
          <span>How the desk works</span>
          <h2>Read less. Understand more. Choose deliberately.</h2>
        </header>
        <div className="method-ledger">
          <article>
            <span>01</span>
            <div>
              <h3>Reduce</h3>
              <p>Only recent, relevant, read-only threads enter the desk.</p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Ground</h3>
              <p>
                Every deadline, task, and priority stays linked to source
                evidence.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Decide</h3>
              <p>
                You accept tasks, review drafts, and control every external
                action.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="trust-boundary" id="boundary">
        <div>
          <span>Permission boundary</span>
          <h2>Your mailbox is source material, never a control surface.</h2>
        </div>
        <dl>
          <div>
            <dt>Read</dt>
            <dd>Recent threads you authorize</dd>
          </div>
          <div>
            <dt>Write</dt>
            <dd>Never</dd>
          </div>
          <div>
            <dt>Send</dt>
            <dd>Never</dd>
          </div>
          <div>
            <dt>Decide</dt>
            <dd>Always you</dd>
          </div>
        </dl>
      </section>

      <footer className="landing-footer">
        <span>Inb0x Labs</span>
        <p>Inbox zero, without inbox theatre.</p>
        <Link href="/dashboard">
          Enter the attention desk <Icon name="arrow" />
        </Link>
      </footer>
    </main>
  );
}
