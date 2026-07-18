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
    <main id="main-content" className="folio-page" tabIndex={-1}>
      <header className="folio-heading">
        <div className="folio-context">
          <span>{eyebrow ?? "Inb0x attention desk"}</span>
          <i aria-hidden="true" />
        </div>
        <div className="folio-title-row">
          <div>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="folio-actions">{actions}</div>}
        </div>
      </header>
      <div className="folio-body">{children}</div>
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
      className={classNames(
        "desk-section",
        pad && "desk-section-pad",
        className,
      )}
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
    <header className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
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
    <article className={classNames("ledger-metric", accent && "is-accent")}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      {icon && <Icon name={icon} />}
    </article>
  );
}

export function LoadingGrid() {
  return (
    <div className="loading-ledger" role="status" aria-label="Loading">
      <span />
      <span />
      <span />
      <span />
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
    <section className="state-sheet state-sheet-error" role="alert">
      <span aria-hidden="true">!</span>
      <div>
        <h3>We lost the thread.</h3>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button
          className="desk-button desk-button-outline"
          type="button"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </section>
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
    <section className="state-sheet">
      <span aria-hidden="true">—</span>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {action}
    </section>
  );
}

export function PriorityLabel({ value }: { value: string }) {
  return <span className={classNames("priority-word", value)}>{value}</span>;
}

export function RelativeTime({ value }: { value: string | null }) {
  return <time dateTime={value ?? undefined}>{formatRelativeTime(value)}</time>;
}
