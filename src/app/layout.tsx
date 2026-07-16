import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inb0x — Noise becomes signal",
  description: "A read-only intelligence workspace for Gmail.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
