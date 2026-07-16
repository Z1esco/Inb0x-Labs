export function formatRelativeTime(value: string | null): string {
  if (!value) return "No date";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown date";
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (Math.abs(minutes) < 2) return "Just now";
  if (minutes > 0 && minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (minutes > 0 && hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (minutes > 0 && days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDate(value: string | null): string {
  if (!value) return "No date set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function initials(value: string | null | undefined): string {
  const source = value?.trim() || "Inb0x";
  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}
