"use client";

import { useSyncExternalStore } from "react";
import { formatCalendarDate, formatRelativeTime } from "@/lib/ui";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function RelativeTime({ value }: { value: string | null }) {
  // A stable UTC date is shared by SSR and the first hydration render. Relative
  // wording is calculated only afterwards, so network delay cannot change SSR text.
  const hydrated = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );
  return (
    <time dateTime={value ?? undefined}>
      {hydrated ? formatRelativeTime(value) : formatCalendarDate(value)}
    </time>
  );
}
