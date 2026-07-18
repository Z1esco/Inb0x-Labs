import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <header className="auth-nav">
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
        <Link className="text-link" href="/">
          Return home <Icon name="arrow" />
        </Link>
      </header>

      <section className="auth-stage">
        <div className="auth-manifesto">
          <p className="eyebrow">Private workspace / Explicit access</p>
          <h1>
            Enter with
            <br />
            <em>less permission.</em>
          </h1>
          <p>
            Signing in creates your Inb0x session. Gmail remains a separate,
            read-only connection that you control.
          </p>
          <ol className="auth-assurances">
            <li>
              <span>01</span>Sign-in never grants mailbox access.
            </li>
            <li>
              <span>02</span>Gmail authorization is separate and read-only.
            </li>
            <li>
              <span>03</span>No reply is sent or mailbox state changed.
            </li>
          </ol>
        </div>

        <div className="auth-entry">
          <div className="auth-entry-heading">
            <span>Workspace access</span>
            <span className="status-label connected">Protected</span>
          </div>
          <h2>Continue to Inb0x</h2>
          <p>Choose a real session or inspect the complete fictional demo.</p>
          <div className="auth-actions">
            <a className="button primary" href="/api/auth/google">
              Continue with Google <Icon name="arrow" />
            </a>
            <Link className="button secondary" href="/dashboard">
              Enter credential-free demo
            </Link>
          </div>
          <div className="auth-boundary">
            <Icon name="check" />
            <span>
              Google sign-in and Gmail authorization are separate permissions.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
