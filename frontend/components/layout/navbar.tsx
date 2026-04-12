"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import LangSwitch from "@/components/lang-switch";
import ThemeToggle from "@/components/theme-toggle";
import CurrencySwitch from "@/components/currency-switch";
import Logo from "@/components/logo";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 bg-white/80 backdrop-blur border-b transition-shadow duration-300 ${scrolled ? "border-zinc-200 shadow-md dark:border-zinc-700" : "border-zinc-100 dark:border-zinc-800"} dark:bg-zinc-950/80`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Logo size={44} variant="icon" /> Shqiponja
          <span className="font-light text-zinc-400">eSIM</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
          <a href="#packages" className="hover:text-shqiponja transition">{t("nav.packages")}</a>
          <a href="#how" className="hover:text-shqiponja transition">{t("nav.how")}</a>
          <Link href="/instalimi" className="hover:text-shqiponja transition">{t("nav.install")}</Link>
          <Link href="/blog" className="hover:text-shqiponja transition">{t("nav.blog")}</Link>
          <Link href="/rreth" className="hover:text-shqiponja transition">{t("nav.about")}</Link>
          <Link href="/faq" className="hover:text-shqiponja transition">{t("nav.faq")}</Link>
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <CurrencySwitch />
          <LangSwitch />
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-zinc-100" />
          ) : user ? (
            <>
              {user.role === "admin" && (
                <Link href="/admin" className="text-sm font-medium text-shqiponja hover:underline">{t("nav.admin")}</Link>
              )}
              <Link href="/profili" className="text-sm font-medium text-zinc-700 hover:text-shqiponja transition">{user.name}</Link>
              <button onClick={logout} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">{t("nav.logout")}</button>
            </>
          ) : (
            <>
              <Link href="/hyr" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">{t("nav.login")}</Link>
              <Link href="/regjistrohu" className="rounded-full bg-shqiponja px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-shqiponja/25 hover:bg-shqiponja-dark transition">{t("nav.register")}</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          <span className={`block h-0.5 w-6 bg-zinc-700 transition-all dark:bg-zinc-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-6 bg-zinc-700 transition-all dark:bg-zinc-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-zinc-700 transition-all dark:bg-zinc-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div id="mobile-nav" role="navigation" className="md:hidden border-t border-zinc-100 bg-white px-6 py-4 space-y-3 dark:bg-zinc-950 dark:border-zinc-800">
          <a href="#packages" onClick={() => setOpen(false)} className="block text-sm font-medium text-zinc-600 hover:text-shqiponja">{t("nav.packages")}</a>
          <a href="#how" onClick={() => setOpen(false)} className="block text-sm font-medium text-zinc-600 hover:text-shqiponja">{t("nav.how")}</a>
          <Link href="/instalimi" onClick={() => setOpen(false)} className="block text-sm font-medium text-zinc-600 hover:text-shqiponja">{t("nav.install")}</Link>
          <Link href="/blog" onClick={() => setOpen(false)} className="block text-sm font-medium text-zinc-600 hover:text-shqiponja">{t("nav.blog")}</Link>
          <Link href="/rreth" onClick={() => setOpen(false)} className="block text-sm font-medium text-zinc-600 hover:text-shqiponja">{t("nav.about")}</Link>
          <Link href="/faq" onClick={() => setOpen(false)} className="block text-sm font-medium text-zinc-600 hover:text-shqiponja">{t("nav.faq")}</Link>
          <div className="flex items-center gap-2 pt-1">
            <ThemeToggle />
            <CurrencySwitch />
            <LangSwitch />
          </div>
          <div className="border-t border-zinc-100 pt-3">
            {loading ? null : user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="block text-sm font-medium text-shqiponja mb-2">{t("nav.admin")}</Link>
                )}
                <Link href="/profili" onClick={() => setOpen(false)} className="block text-sm font-medium text-zinc-700 mb-2">{user.name}</Link>
                <button onClick={() => { logout(); setOpen(false); }} className="w-full rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">{t("nav.logout")}</button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link href="/hyr" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-zinc-200 py-2 text-center text-sm font-medium text-zinc-600 hover:bg-zinc-50">{t("nav.login")}</Link>
                <Link href="/regjistrohu" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-shqiponja py-2 text-center text-sm font-semibold text-white hover:bg-shqiponja-dark">{t("nav.register")}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
