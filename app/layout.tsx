import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Log transport and entertainment claims in minutes, not hours",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-neutral-50 text-neutral-900 min-h-screen">
        <header className="bg-white border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight text-lg">
              <span className="text-indigo-600">Expense</span> Tracker
            </Link>
            <span className="text-xs text-neutral-400 hidden sm:block">
              Transport &amp; entertainment claims in minutes
            </span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
