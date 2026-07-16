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

export function AppNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
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
        <p className="sidebar-section-label">Workspace</p>
        <Navigation onNavigate={() => setOpen(false)} />
        <div className="sidebar-footer">
          <div className="connection-line">
            <span className="status-dot connected" />
            <span>Read-only workspace</span>
          </div>
          <div className="user-mini">
            <span className="avatar">JD</span>
            <div>
              <strong>Demo Judge</strong>
              <span>Inb0x Labs</span>
            </div>
          </div>
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
            <span className="status-label connected">
              <span className="status-dot connected" /> Demo mode
            </span>
            <Link
              className="icon-button"
              href="/settings"
              aria-label="Open settings"
            >
              <Icon name="settings" />
            </Link>
            <span className="avatar" aria-label="Demo Judge">
              {initials("Demo Judge")}
            </span>
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
        {children}
      </div>
    </div>
  );
}
