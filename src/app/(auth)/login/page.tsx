import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <header className="auth-header">
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
        <Link className="button ghost" href="/">
          Back to home
        </Link>
      </header>
      <section className="auth-layout" aria-labelledby="auth-title">
        <div className="auth-intro">
          <p className="eyebrow">A considered connection</p>
          <h1 id="auth-title">
            Make room for <em>signal.</em>
          </h1>
          <p>
            Your Inb0x session and Gmail connection are distinct. Sign in first;
            decide about mailbox access with the full context in view.
          </p>
          <div className="auth-line" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="auth-card">
          <p className="eyebrow">Sign in to Inb0x</p>
          <h2>Continue with Google</h2>
          <p>
            We use Google to establish your application session. Gmail access is
            requested separately and only after you choose to connect it.
          </p>
          <a className="button primary auth-google" href="/api/auth/google">
            <Icon name="arrow" /> Continue with Google
          </a>
          <div
            className="consent-list"
            aria-label="Read-only permission details"
          >
            <div>
              <Icon name="check" label="Read-only" />
              <span>
                <strong>Read-only by default</strong>Inb0x never sends email or
                changes your Gmail mailbox.
              </span>
            </div>
            <div>
              <Icon name="check" label="Review required" />
              <span>
                <strong>Review stays with you</strong>Reply drafts are copy-only
                and require your approval.
              </span>
            </div>
            <div>
              <Icon name="check" label="Separate connection" />
              <span>
                <strong>Disconnect anytime</strong>Gmail permission remains
                separate from your Inb0x account.
              </span>
            </div>
          </div>
          <Link className="button secondary auth-demo" href="/dashboard">
            <Icon name="spark" /> Enter credential-free demo
          </Link>
        </div>
      </section>
    </main>
  );
}
