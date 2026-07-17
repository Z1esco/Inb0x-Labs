"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { classNames, initials } from "@/lib/ui";

const links: Array<[string, string, IconName]> = [
  ["Dashboard", "/dashboard", "dashboard"],
  ["Inbox", "/inbox", "inbox"],
  ["Tasks", "/tasks", "tasks"],
  ["Drafts", "/drafts", "copy"],
  ["Insights", "/insights", "trend"],
  ["Settings", "/settings", "settings"],
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="sidebar-nav">
      {links.map(([label, href, icon]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            className="nav-link"
            href={href}
            aria-current={active ? "page" : undefined}
            {...(onNavigate ? { onClick: onNavigate } : {})}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const userLabel = demo ? "Demo Judge" : (userEmail ?? "Inb0x user");
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
  const active = links.find(
    ([, href]) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return (
    <div className="app-shell">
      <aside
        className={classNames("app-sidebar", open && "open")}
        aria-label="Primary navigation"
      >
        <Link
          className="brand-lockup"
          href="/dashboard"
          onClick={() => setOpen(false)}
        >
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
        <p className="sidebar-section-label">Workspace</p>
        <Navigation onNavigate={() => setOpen(false)} />
        <div className="sidebar-footer">
          <div className="connection-line">
            <span className="status-dot connected" />
            <span>Read-only workspace</span>
          </div>
          <div className="user-mini">
            <span className="avatar">{initials(userLabel)}</span>
            <div>
              <strong>{userLabel}</strong>
              <span>
                {demo ? "Credential-free demo" : "Authenticated workspace"}
              </span>
            </div>
          </div>
          <button
            className="nav-link sign-out-button"
            type="button"
            disabled={signingOut}
            onClick={() => void signOut()}
          >
            <Icon name="close" />
            <span>
              {demo ? "Exit demo" : signingOut ? "Signing out..." : "Sign out"}
            </span>
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-context">
            <button
              className="icon-button mobile-menu-button"
              type="button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <Icon name={open ? "close" : "menu"} />
            </button>
            <span className="status-dot connected" />
            <strong>{active?.[0] ?? "Workspace"}</strong>
            <span>/</span>
            <span>Signal room</span>
          </div>
          <div className="topbar-actions">
            <Link
              className="topbar-search"
              href="/inbox"
              aria-label="Search inbox"
            >
              <Icon name="search" />
              <span>Search</span>
            </Link>
            <Link className="button primary topbar-analyze" href="/inbox">
              Analyze inbox
            </Link>
            <span className="status-label connected">
              <span className="status-dot connected" />
              {demo ? "Demo mode" : "Live workspace"}
            </span>
            <Link
              className="icon-button"
              href="/settings"
              aria-label="Open settings"
            >
              <Icon name="settings" />
            </Link>
            <div className="user-menu-wrap">
              <button
                className="avatar"
                type="button"
                aria-label="Open user menu"
                aria-expanded={userMenuOpen}
                aria-controls="user-menu"
                onClick={() => setUserMenuOpen((value) => !value)}
              >
                {initials(userLabel)}
              </button>
              {userMenuOpen && (
                <div id="user-menu" className="user-menu" role="menu">
                  <Link
                    className="nav-link"
                    href="/settings"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Icon name="settings" />
                    <span>Settings</span>
                  </Link>
                  <button
                    className="nav-link sign-out-button"
                    type="button"
                    role="menuitem"
                    disabled={signingOut}
                    onClick={() => void signOut()}
                  >
                    <Icon name="close" />
                    <span>{demo ? "Exit demo" : "Sign out"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {links.slice(0, 4).map(([label, href, icon]) => {
            const selected =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                className="nav-link"
                href={href}
                aria-current={selected ? "page" : undefined}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
