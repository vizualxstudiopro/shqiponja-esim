"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getPackages, type EsimPackage } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

const SITE_URL = "https://shqiponjaesim.com";

/* ── Share helpers ── */
function shareUrl(pkgId: number) {
  return `${SITE_URL}/bli/${pkgId}`;
}
function facebookShare(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
function whatsappShare(url: string, text: string) {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`;
}
function twitterShare(url: string, text: string) {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
function telegramShare(url: string, text: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/* ── SVG Icons ── */
function FacebookIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function TelegramIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/* ── Football SVG icon ── */
function FootballIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ── Host countries config ── */
interface HostCountry {
  country: string;
  countryCode: string;
  image: string;
  cityLabel: string;
  cityLabelEn: string;
}

const HOST_COUNTRIES: HostCountry[] = [
  {
    country: "United States",
    countryCode: "us",
    image: "https://images.unsplash.com/photo-1508693926297-1d61ee3df82a?w=600&h=400&fit=crop&q=80",
    cityLabel: "New York, Los Angeles, Miami...",
    cityLabelEn: "New York, Los Angeles, Miami...",
  },
  {
    country: "Canada",
    countryCode: "ca",
    image: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=600&h=400&fit=crop&q=80",
    cityLabel: "Toronto, Vancouver...",
    cityLabelEn: "Toronto, Vancouver...",
  },
  {
    country: "Mexico",
    countryCode: "mx",
    image: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=600&h=400&fit=crop&q=80",
    cityLabel: "Mexico City, Guadalajara...",
    cityLabelEn: "Mexico City, Guadalajara...",
  },
];

/* ── Countdown target: June 11, 2026 ── */
const WORLD_CUP_START = new Date("2026-06-11T00:00:00Z");

function useCountdown() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, WORLD_CUP_START.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isOver: diff === 0 };
}

function FlagIcon({ code }: { code: string }) {
  return <span className={`fi fi-${code} fis`} style={{ fontSize: "1.5rem", borderRadius: "4px", display: "inline-block" }} />;
}

export default function WorldCupSection() {
  const { t, locale } = useI18n();
  const countdown = useCountdown();
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPackages()
      .then((pkgs) => setPackages(pkgs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = useMemo(() => {
    return HOST_COUNTRIES.map((host) => {
      const countryPkgs = packages.filter(
        (p) =>
          p.name.toLowerCase().includes(host.country.toLowerCase()) &&
          p.package_type === "sim" &&
          (p.visible === undefined || p.visible)
      );
      countryPkgs.sort((a, b) => a.price - b.price);
      return { ...host, pkg: countryPkgs[0] || null };
    }).filter((c) => c.pkg !== null);
  }, [packages]);

  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Background: dark football-themed gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#16213e] to-[#0f3460]" />

      {/* Subtle pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,.03)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(255,255,255,.02)_0%,transparent_50%)]" />

      {/* Animated glow accents */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#e94560]/15 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[#533483]/20 blur-3xl animate-pulse delay-500" />

      {/* Floating football decorations */}
      <div className="pointer-events-none absolute top-10 right-[15%] opacity-10">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="white">
          <circle cx="40" cy="40" r="38" stroke="white" strokeWidth="2" fill="none" />
          <polygon points="40,15 50,30 47,45 33,45 30,30" fill="white" opacity="0.4" />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-20 left-[10%] opacity-10 rotate-45">
        <svg width="60" height="60" viewBox="0 0 80 80" fill="white">
          <circle cx="40" cy="40" r="38" stroke="white" strokeWidth="2" fill="none" />
          <polygon points="40,15 50,30 47,45 33,45 30,30" fill="white" opacity="0.4" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-bold uppercase tracking-widest text-[#e94560] backdrop-blur-sm border border-white/10">
            ⚽ {t("worldcup.badge")}
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("worldcup.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            {t("worldcup.subtitle")}
          </p>

          {/* Countdown Timer */}
          {!countdown.isOver && (
            <div className="mt-8 flex justify-center gap-3 sm:gap-5">
              {[
                { val: countdown.days, label: t("worldcup.days") },
                { val: countdown.hours, label: t("worldcup.hours") },
                { val: countdown.minutes, label: t("worldcup.minutes") },
                { val: countdown.seconds, label: t("worldcup.seconds") },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center">
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <span className="text-2xl sm:text-3xl font-extrabold tabular-nums text-white">
                      {String(item.val).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="mt-14">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white/5 h-96" />
              ))}
            </div>
          ) : cards.length === 0 ? null : (
            <div className="grid gap-6 sm:grid-cols-3">
              {cards.map((card) => {
                const url = shareUrl(card.pkg!.id);
                const text = `⚽ FIFA World Cup 2026 — ${card.country} eSIM €${card.pkg!.price.toFixed(2)} | Shqiponja eSIM`;
                return (
                  <div
                    key={card.countryCode}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#e94560]/10"
                  >
                    {/* Image */}
                    <Link href={`/bli/${card.pkg!.id}`} className="relative h-52 overflow-hidden">
                      <img
                        src={card.image}
                        alt={card.country}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a2e]/90 via-[#1a0a2e]/30 to-transparent" />

                      {/* World Cup tag */}
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#e94560] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#e94560]/30">
                        ⚽ FIFA 2026
                      </span>

                      {/* Country name + flag */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5">
                        <FlagIcon code={card.countryCode} />
                        <div>
                          <h3 className="text-xl font-bold text-white drop-shadow-lg">
                            {card.country}
                          </h3>
                          <p className="text-xs text-white/60">
                            {locale === "sq" ? card.cityLabel : card.cityLabelEn}
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Info area */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      {/* Package details */}
                      <div className="flex items-center justify-between text-sm text-white/50">
                        <span>{card.pkg!.data}</span>
                        <span>{card.pkg!.duration}</span>
                      </div>

                      {/* Price + Buy */}
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <span className="text-xs uppercase tracking-wider text-white/40">{t("worldcup.from")}</span>
                          <div className="text-3xl font-extrabold text-white">
                            €{card.pkg!.price.toFixed(2)}
                          </div>
                        </div>
                        <Link
                          href={`/bli/${card.pkg!.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#e94560] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#e94560]/30 transition-all hover:bg-[#d63851] hover:shadow-[#e94560]/50 hover:scale-105"
                        >
                          {t("worldcup.buy")}
                          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </Link>
                      </div>

                      {/* Share buttons */}
                      <div className="mt-4 flex items-center gap-1.5 border-t border-white/10 pt-4">
                        <span className="mr-auto text-[11px] font-medium uppercase tracking-wider text-white/30">
                          {t("tourist.share")}
                        </span>
                        <a href={facebookShare(url)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2]/20 text-[#5b9cf5] transition hover:bg-[#1877F2] hover:text-white" aria-label="Facebook">
                          <FacebookIcon />
                        </a>
                        <a href={whatsappShare(url, text)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/20 text-[#5ee08a] transition hover:bg-[#25D366] hover:text-white" aria-label="WhatsApp">
                          <WhatsAppIcon />
                        </a>
                        <a href={telegramShare(url, text)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0088cc]/20 text-[#4db5e5] transition hover:bg-[#0088cc] hover:text-white" aria-label="Telegram">
                          <TelegramIcon />
                        </a>
                        <a href={twitterShare(url, text)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/50 transition hover:bg-white hover:text-zinc-900" aria-label="X">
                          <XIcon />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <a
            href="#packages"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/30"
          >
            {t("worldcup.allPackages")}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
