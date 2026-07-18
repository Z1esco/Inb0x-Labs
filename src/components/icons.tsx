import type { ReactNode } from "react";

export type IconName =
  | "activity"
  | "arrow"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "copy"
  | "dashboard"
  | "inbox"
  | "menu"
  | "plus"
  | "search"
  | "settings"
  | "tasks"
  | "trend"
  | "warning";

const paths: Record<IconName, ReactNode> = {
  activity: <path d="M3 12h3l2-7 4 14 2-7h7" />,
  arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
  check: <path d="m5 12 4 4 10-10" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  copy: (
    <>
      <rect x="8" y="8" width="10" height="11" rx="1" />
      <path d="M6 15V5a1 1 0 0 1 1-1h8" />
    </>
  ),
  dashboard: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 5h16v13H4z" />
      <path d="M4 14h4l2 3h4l2-3h4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m16 16 4 4" />
    </>
  ),
  settings: (
    <>
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  tasks: (
    <>
      <path d="M5 5h14v14H5z" />
      <path d="m8 12 2 2 5-5M8 8h3M8 17h5" />
    </>
  ),
  trend: <path d="m4 16 5-5 4 3 7-8M15 6h5v5" />,
  warning: (
    <>
      <path d="m12 4 8 15H4L12 4Z" />
      <path d="M12 9v4m0 3h.01" />
    </>
  ),
};

export function Icon({ name, label }: { name: IconName; label?: string }) {
  return (
    <span
      className="icon"
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" role={label ? "img" : undefined}>
        {paths[name]}
      </svg>
    </span>
  );
}
