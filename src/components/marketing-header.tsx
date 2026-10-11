"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  return (
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Link className="site-brand" href="/" aria-label="Inb0x Labs home">
          <Image
            src="/logo/inb0x-labs-logo.png"
            alt=""
            width={36}
            height={36}
            priority
          />
          <span>
            Inb0x <span>Labs</span>
          </span>
        </Link>
        <button
          ref={trigger}
          type="button"
          className="site-menu-toggle"
          aria-label={open ? "Close site navigation" : "Open site navigation"}
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
        <nav
          id="site-navigation"
          className={`site-navigation${open ? " is-open" : ""}`}
          aria-label="Site navigation"
          onClick={() => setOpen(false)}
        >
          <a href="#product" tabIndex={0}>
            Product
          </a>
          <a href="#method" tabIndex={0}>
            How it works
          </a>
          <a href="#boundary" tabIndex={0}>
            Privacy
          </a>
          <Link className="site-nav-demo" href="/dashboard" tabIndex={0}>
            Open the demo
          </Link>
          <Link className="site-nav-signin" href="/login" tabIndex={0}>
            Sign in <Icon name="arrow" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
