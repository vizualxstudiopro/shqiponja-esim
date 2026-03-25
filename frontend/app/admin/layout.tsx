"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useEffect, useState, type ReactNode } from "react";
import Logo from "@/components/logo";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { href: "/admin", label: t("admin.dashboard"), icon: "📊" },
    { href: "/admin/paketat", label: t("admin.packages"), icon: "📦" },
    { href: "/admin/porosite", label: t("admin.orders"), icon: "🧾" },
    { href: "/admin/perdoruesit", label: t("admin.users"), icon: "👥" },
    { href: "/admin/siguria", label: t("admin.security"), icon: "🔒" },
  ];

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/hyr");
    }
  }, [user, loading, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-zinc-100 px-5 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Logo size={28} /> Admin
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden dark:hover:bg-zinc-800"
          aria-label="Mbyll menunë"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <nav className="mt-3 space-y-1 px-3 flex-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              pathname === l.href
                ? "bg-shqiponja/10 text-shqiponja"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
        <Link href="/" className="text-sm text-zinc-500 hover:text-shqiponja transition dark:text-zinc-400">
          ← {t("admin.backToSite")}
        </Link>
      </div>
    </>
  );

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — desktop: static, mobile: slide-over */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white transition-transform duration-200 ease-in-out dark:bg-zinc-900 lg:relative lg:z-auto lg:translate-x-0 lg:border-r lg:border-zinc-200 dark:lg:border-zinc-800 ${
            sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-900/80">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label="Hap menunë"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <span className="text-sm font-bold flex items-center gap-1.5"><Logo size={24} /> Admin</span>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </>
  );
}
