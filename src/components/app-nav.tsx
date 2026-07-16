import Link from "next/link";
const links = [
  ["Dashboard", "/dashboard"],
  ["Inbox", "/inbox"],
  ["Tasks", "/tasks"],
  ["Drafts", "/drafts"],
  ["Insights", "/insights"],
  ["Settings", "/settings"],
] as const;
export function AppNav() {
  return (
    <nav>
      <div className="shell">
        <Link href="/dashboard">📬 Inb0x</Link>
        {links.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
