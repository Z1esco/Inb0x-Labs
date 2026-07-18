"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { classNames, initials } from "@/lib/ui";

const links: Array<[string, string, IconName, string]> = [
  ["Dashboard", "/dashboard", "dashboard", "01"],
  ["Inbox", "/inbox", "inbox", "02"],
  ["Tasks", "/tasks", "tasks", "03"],
  ["Drafts", "/drafts", "copy", "04"],
  ["Insights", "/insights", "trend", "05"],
  ["Settings", "/settings", "settings", "06"],
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="primary-nav" aria-label="Workspace routes">
      {links.map(([label, href, icon, index]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            className="nav-link"
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            {...(onNavigate ? { onClick: onNavigate } : {})}
          >
            <span className="nav-index">{index}</span>
            <Icon name={icon} />
            <span className="nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppNav({
  children,
  demo,
  userEmail,
}: {
  children: ReactNode;
  demo: boolean;
  userEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const userLabel = demo ? "Demo Judge" : (userEmail ?? "Inb0x user");
  const active = links.find(
    ([, href]) => pathname === href || pathname.startsWith(`${href}/`),
  );

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) window.location.assign("/");
      else setSigningOut(false);
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-masthead">
        <Link className="brand-lockup" href="/dashboard">
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

        <aside
          className={classNames("app-navigation", open && "open")}
          aria-label="Primary navigation"
        >
          <div className="drawer-heading">
            <span>Workspace index</span>
            <button
              className="icon-button"
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <Navigation onNavigate={() => setOpen(false)} />
          <div className="drawer-session">
            <div className="user-mini">
              <span className="avatar">{initials(userLabel)}</span>
              <div>
                <strong>{userLabel}</strong>
                <span>
                  {demo ? "Fictional workspace" : "Authenticated workspace"}
                </span>
              </div>
            </div>
            <button
              className="text-link sign-out-button"
              type="button"
              disabled={signingOut}
              onClick={() => void signOut()}
            >
              {demo ? "Exit demo" : signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </aside>

        <div className="masthead-actions">
          <span className="mode-indicator">
            <i />
            {demo ? "Demo" : "Live"}
          </span>
          <button
            className="text-link session-exit"
            type="button"
            disabled={signingOut}
            onClick={() => void signOut()}
          >
            {demo ? "Exit demo" : signingOut ? "Signing out..." : "Sign out"}
          </button>
          <Link
            className="icon-button"
            href="/settings"
            aria-label="Open settings"
          >
            <Icon name="settings" />
          </Link>
          <span className="avatar" aria-label={userLabel}>
            {initials(userLabel)}
          </span>
          <button
            className="icon-button mobile-menu-button"
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <div className="dispatch-bar">
        <span>{active?.[3] ?? "00"}</span>
        <strong>{active?.[0] ?? "Workspace"}</strong>
        <i />
        <span>
          <b className="status-dot connected" /> Gmail stays read-only
        </span>
      </div>

      <div className="app-main">{children}</div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {links.slice(0, 4).map(([label, href, icon]) => {
          const selected = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              className="nav-link"
              href={href}
              aria-label={label}
              aria-current={selected ? "page" : undefined}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
