"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useEffect, useState, type ReactNode } from "react";
import Logo from "@/components/logo";
import { LayoutDashboard, Package, Receipt, Users, ShieldCheck, ArrowLeft, X, Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { href: "/admin", label: t("admin.dashboard"), icon: LayoutDashboard },
    { href: "/admin/paketat", label: t("admin.packages"), icon: Package },
    { href: "/admin/porosite", label: t("admin.orders"), icon: Receipt },
    { href: "/admin/perdoruesit", label: t("admin.users"), icon: Users },
    { href: "/admin/siguria", label: t("admin.security"), icon: ShieldCheck },
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
          <Logo size={32} variant="icon" /> Admin
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden dark:hover:bg-zinc-800"
          aria-label="Mbyll menunë"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="mt-3 space-y-1 px-3 flex-1">
        {links.map((l) => {
          const Icon = l.icon;
          const active = l.href === "/admin" ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-shqiponja/10 text-shqiponja"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-shqiponja transition dark:text-zinc-400">
          <ArrowLeft className="h-4 w-4" />
          {t("admin.backToSite")}
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
              <Menu className="h-[22px] w-[22px]" />
            </button>
            <span className="text-sm font-bold flex items-center gap-1.5"><Logo size={28} variant="icon" /> Admin</span>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </>
  );
}
