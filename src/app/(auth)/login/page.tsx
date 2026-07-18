import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

export default function LoginPage() {
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
        <Link className="button ghost" href="/">
          Back to home
        </Link>
      </header>
      <section className="login-layout">
        <div className="login-statement">
          <p className="eyebrow">Secure workspace access</p>
          <h1>Make room for signal.</h1>
          <p>
            A private attention desk for people whose inbox has become a second
            workplace.
          </p>
          <div className="login-assurances" aria-label="Privacy assurances">
            <span>01</span>
            <p>Signing in never grants mailbox access.</p>
            <span>02</span>
            <p>Gmail authorization is separate and read-only.</p>
            <span>03</span>
            <p>Nothing is sent, modified, or acted on without you.</p>
          </div>
        </div>
        <div className="login-action">
          <div>
            <p className="login-action-label">Enter your workspace</p>
            <a className="button primary" href="/api/auth/google">
              Continue with Google <Icon name="arrow" />
            </a>
            <Link className="button secondary" href="/dashboard">
              Explore the credential-free demo
            </Link>
          </div>
          <p className="login-footnote">
            <Icon name="check" /> Your Inb0x session and Gmail connection are
            separate permissions.
          </p>
        </div>
      </section>
    </main>
  );
}
