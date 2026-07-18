"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { classNames, initials } from "@/lib/ui";

const routes: Array<{
  label: string;
  href: string;
  icon: IconName;
  key: string;
}> = [
  { label: "Briefing", href: "/dashboard", icon: "dashboard", key: "01" },
  { label: "Correspondence", href: "/inbox", icon: "inbox", key: "02" },
  { label: "Tasks", href: "/tasks", icon: "tasks", key: "03" },
  { label: "Replies", href: "/drafts", icon: "copy", key: "04" },
  { label: "Patterns", href: "/insights", icon: "trend", key: "05" },
  { label: "Preferences", href: "/settings", icon: "settings", key: "06" },
];

function RouteIndex({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="route-index" aria-label="Workspace routes">
      {routes.map((route) => {
        const active =
          pathname === route.href || pathname.startsWith(`${route.href}/`);
        return (
          <Link
            key={route.href}
            href={route.href}
            className="route-index-link"
            aria-label={route.label}
            aria-current={active ? "page" : undefined}
            {...(onNavigate ? { onClick: onNavigate } : {})}
          >
            <span aria-hidden="true">{route.key}</span>
            <strong>{route.label}</strong>
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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const userLabel = demo ? "Demo Judge" : (userEmail ?? "Inb0x user");
  const currentRoute = routes.find(
    (route) => pathname === route.href || pathname.startsWith(`${route.href}/`),
  );

  useEffect(() => {
    if (!menuOpen) return;

    menuCloseRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      requestAnimationFrame(() => menuTriggerRef.current?.focus());
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

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
    <div className="desk-shell">
      <header className="desk-header">
        <div className="desk-header-primary">
          <Link
            className="desk-brand"
            href="/dashboard"
            aria-label="Inb0x home"
          >
            <Image
              src="/logo/inb0x-labs-logo.png"
              alt=""
              width={42}
              height={42}
              priority
            />
            <span>INB0X</span>
            <small>attention desk</small>
          </Link>

          <aside
            className={classNames("route-drawer", menuOpen && "is-open")}
            aria-label="Primary navigation"
          >
            <div className="route-drawer-title">
              <span>Index</span>
              <button
                ref={menuCloseRef}
                type="button"
                className="plain-icon-button"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <RouteIndex onNavigate={() => setMenuOpen(false)} />
            <div className="drawer-account">
              <span>{initials(userLabel)}</span>
              <div>
                <strong>{userLabel}</strong>
                <small>
                  {demo ? "Fictional workspace" : "Private workspace"}
                </small>
              </div>
            </div>
          </aside>

          <div className="desk-account">
            <span className="workspace-state">
              <i aria-hidden="true" /> {demo ? "Demo desk" : "Private desk"}
            </span>
            <button
              className="account-trigger"
              type="button"
              aria-label="Open user menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
            >
              <span>{initials(userLabel)}</span>
              <strong>{userLabel}</strong>
              <Icon name="chevron" />
            </button>
            {accountOpen && (
              <div className="account-popover" role="menu">
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setAccountOpen(false)}
                >
                  Preferences
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  disabled={signingOut}
                  onClick={() => void signOut()}
                >
                  {demo
                    ? "Exit demo"
                    : signingOut
                      ? "Signing out…"
                      : "Sign out"}
                </button>
              </div>
            )}
            <button
              ref={menuTriggerRef}
              type="button"
              className="plain-icon-button mobile-index-trigger"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>

        <div className="desk-header-secondary">
          <div>
            <span>{currentRoute?.key ?? "00"}</span>
            <strong>{currentRoute?.label ?? "Workspace"}</strong>
          </div>
          <RouteIndex />
          <div className="permission-note">
            <Icon name="check" /> Gmail remains read-only
          </div>
        </div>
      </header>

      <div className="desk-canvas">{children}</div>

      <nav className="mobile-desk-nav" aria-label="Mobile navigation">
        {routes.slice(0, 4).map((route) => {
          const active =
            pathname === route.href || pathname.startsWith(`${route.href}/`);
          return (
            <Link
              key={route.href}
              href={route.href}
              aria-label={route.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon name={route.icon} />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
