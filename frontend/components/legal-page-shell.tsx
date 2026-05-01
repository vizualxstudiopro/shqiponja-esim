"use client";

import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type LegalPageShellProps = {
  children: ReactNode;
  contentClassName?: string;
};

export default function LegalPageShell({ children, contentClassName }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className={contentClassName ?? "mx-auto max-w-3xl px-6 py-16"}>{children}</main>
      <Footer />
    </div>
  );
}
