import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

export default function LoginPage() {
  return (
    <main className="entry-page">
      <header className="entry-header">
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
        <Link className="text-action" href="/">
          Return to the front page
        </Link>
      </header>

      <section className="entry-stage">
        <div className="entry-statement">
          <span>Workspace access</span>
          <h1>
            One sign-in.
            <br />
            Two separate
            <br />
            <em>permissions.</em>
          </h1>
          <p>
            Your Inb0x session identifies you. Gmail access is requested
            separately, remains read-only, and can be disconnected at any time.
          </p>
        </div>

        <div className="entry-form">
          <header>
            <span>Private attention desk</span>
            <strong>Sign in</strong>
          </header>
          <div className="entry-actions">
            <a className="desk-button desk-button-ink" href="/api/auth/google">
              Continue with Google <Icon name="arrow" />
            </a>
            <Link className="desk-button desk-button-outline" href="/dashboard">
              Enter the fictional demo
            </Link>
          </div>
          <ol className="entry-permissions">
            <li>
              <span>01</span>
              <p>
                <strong>Sign-in</strong> creates only your private Inb0x
                session.
              </p>
            </li>
            <li>
              <span>02</span>
              <p>
                <strong>Gmail</strong> is connected later with read-only
                authorization.
              </p>
            </li>
            <li>
              <span>03</span>
              <p>
                <strong>Replies</strong> remain copy-only. Nothing is sent from
                Inb0x.
              </p>
            </li>
          </ol>
          <p className="entry-note">
            <Icon name="check" /> No mailbox action happens on this screen.
          </p>
        </div>
      </section>
    </main>
  );
}
