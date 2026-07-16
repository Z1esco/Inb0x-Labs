import Link from "next/link";
export default function LoginPage() {
  return (
    <main>
      <div className="shell" style={{ maxWidth: 520 }}>
        <div className="card grid">
          <span className="tag" style={{ width: "fit-content" }}>
            Secure application sign-in
          </span>
          <h1>Welcome to Inb0x</h1>
          <p className="muted">
            Application identity and Gmail authorization are separate. Signing
            in does not grant mailbox access.
          </p>
          <a className="button" href="/api/auth/google">
            Continue with Google
          </a>
          <Link className="button secondary" href="/dashboard">
            Use credential-free demo
          </Link>
        </div>
      </div>
    </main>
  );
}
