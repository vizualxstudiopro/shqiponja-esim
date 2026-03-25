"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useEffect, type ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: t("admin.dashboard") },
    { href: "/admin/paketat", label: t("admin.packages") },
    { href: "/admin/porosite", label: t("admin.orders") },
    { href: "/admin/perdoruesit", label: t("admin.users") },
    { href: "/admin/siguria", label: t("admin.security") },
  ];

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/hyr");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="relative flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-100 px-6 dark:border-zinc-800">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="text-shqiponja">🦅</span> Admin
          </Link>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-shqiponja/10 text-shqiponja"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-zinc-100 p-4 dark:border-zinc-800">
          <Link href="/" className="text-sm text-zinc-500 hover:text-shqiponja transition dark:text-zinc-400">
            ← {t("admin.backToSite")}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">{children}</main>
    </div>
    </>
  );
}
