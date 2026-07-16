import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inb0x — Email, clarified",
  description: "A read-only AI productivity layer for Gmail.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
