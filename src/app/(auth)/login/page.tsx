import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";

export default function LoginPage() {
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
        <Link className="button ghost" href="/">
          Back to home
        </Link>
      </header>
      <section
        style={{ display: "grid", minHeight: "70vh", placeItems: "center" }}
      >
        <div
          className="surface surface-pad"
          style={{ width: "min(100%, 520px)" }}
        >
          <p className="eyebrow">Secure workspace access</p>
          <h1>Make room for signal.</h1>
          <p className="muted">
            Your Inb0x session and Gmail connection are separate permissions.
            Signing in alone never grants mailbox access.
          </p>
          <div className="stack" style={{ marginTop: 26 }}>
            <a className="button primary" href="/api/auth/google">
              <Icon name="arrow" /> Continue with Google
            </a>
            <Link className="button secondary" href="/dashboard">
              <Icon name="spark" /> Enter credential-free demo
            </Link>
          </div>
          <div className="success-box" style={{ marginTop: 22 }}>
            <Icon name="check" /> Gmail access is read-only. Replies stay
            copy-only and are never sent by Inb0x.
          </div>
        </div>
      </section>
    </main>
  );
}
