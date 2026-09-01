import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deft Designer — studio management for interior designers",
  description:
    "Run your interior design studio: clients, projects, selections, time, invoices and a client portal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
