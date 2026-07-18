import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { classNames, formatRelativeTime } from "@/lib/ui";

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main id="main-content" className="page" tabIndex={-1}>
      <header className="page-header">
        <div className="page-header-grid">
          {eyebrow && <p className="page-context">{eyebrow}</p>}
          <div className="page-header-copy">
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
        </div>
        {actions && <div className="header-actions">{actions}</div>}
      </header>
      {children}
    </main>
  );
}

export function Surface({
  children,
  className,
  pad = true,
  role,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
  role?: "alert" | "status";
}) {
  return (
    <section
      className={classNames("surface", pad && "surface-pad", className)}
      role={role}
    >
      {children}
    </section>
  );
}

export function SurfaceHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon?: IconName;
  accent?: boolean;
}) {
  return (
    <article
      className={classNames("surface", "metric-card", accent && "accent")}
    >
      <div className="metric-label">
        <span>{label}</span>
        {icon && <Icon name={icon} />}
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function LoadingGrid() {
  return (
    <div className="metric-grid" role="status" aria-label="Loading">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Surface className="empty-state error-state" role="alert">
      <Icon name="warning" label="Error" />
      <h3>Signal interrupted</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="button secondary" type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </Surface>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Surface className="empty-state">
      <Icon name="inbox" label="Empty" />
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </Surface>
  );
}

export function PriorityLabel({ value }: { value: string }) {
  return <span className={classNames("status-label", value)}>{value}</span>;
}

export function RelativeTime({ value }: { value: string | null }) {
  return <time dateTime={value ?? undefined}>{formatRelativeTime(value)}</time>;
}
