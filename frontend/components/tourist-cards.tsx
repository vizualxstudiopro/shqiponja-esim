"use client";

import { useEffect, useState } from "react";
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

/* ── SVG icons for share buttons ── */
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

/* ── Tourist destination config ── */
interface TouristDest {
  country: string;       // country name to match in packages
  countryCode: string;   // 2-letter code for flag-icons
  image: string;         // Unsplash image URL
  tagKey: string;        // translation key for the tag ("Plazh", "Histori", etc.)
}

const DESTINATIONS: TouristDest[] = [
  {
    country: "Greece",
    countryCode: "gr",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagBeach",
  },
  {
    country: "Turkey",
    countryCode: "tr",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagCulture",
  },
  {
    country: "Italy",
    countryCode: "it",
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagHistory",
  },
  {
    country: "Spain",
    countryCode: "es",
    image: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagBeach",
  },
  {
    country: "Croatia",
    countryCode: "hr",
    image: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagBeach",
  },
  {
    country: "Thailand",
    countryCode: "th",
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagExotic",
  },
  {
    country: "Egypt",
    countryCode: "eg",
    image: "https://images.unsplash.com/photo-1539768942893-daf53e736b68?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagHistory",
  },
  {
    country: "Montenegro",
    countryCode: "me",
    image: "https://images.unsplash.com/photo-1584132905271-512c958d674a?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagBeach",
  },
  {
    country: "Albania",
    countryCode: "al",
    image: "https://images.unsplash.com/photo-1596005554384-d293674c91d7?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagBeach",
  },
  {
    country: "France",
    countryCode: "fr",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop&q=80",
    tagKey: "tourist.tagCulture",
  },
];

function FlagIcon({ code }: { code: string }) {
  return <span className={`fi fi-${code} fis`} style={{ fontSize: "1.25rem", borderRadius: "4px", display: "inline-block" }} />;
}

export default function TouristCards() {
  const { t } = useI18n();
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPackages()
      .then((pkgs) => setPackages(pkgs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Find the cheapest package for each destination country
  const cards = DESTINATIONS.map((dest) => {
    const countryPkgs = packages.filter(
      (p) =>
        p.name.toLowerCase().includes(dest.country.toLowerCase()) &&
        p.package_type === "sim" &&
        (p.visible === undefined || p.visible)
    );
    // Sort by price ascending, pick cheapest
    countryPkgs.sort((a, b) => a.price - b.price);
    const cheapest = countryPkgs[0] || null;
    return { ...dest, pkg: cheapest };
  }).filter((c) => c.pkg !== null);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800 h-80" />
        ))}
      </div>
    );
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const url = shareUrl(card.pkg!.id);
        const text = `${card.pkg!.name.split("—")[0]?.trim() || card.country} eSIM — €${card.pkg!.price.toFixed(2)} | Shqiponja eSIM`;
        return (
        <div
          key={card.countryCode}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 dark:border-zinc-700 dark:bg-zinc-800"
        >
          {/* Image — clickable to buy */}
          <Link href={`/bli/${card.pkg!.id}`} className="relative h-44 overflow-hidden">
            <img
              src={card.image}
              alt={card.country}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Tag */}
            <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-700 backdrop-blur-sm dark:bg-black/60 dark:text-zinc-200">
              {t(card.tagKey as never)}
            </span>

            {/* Country name over image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
              <FlagIcon code={card.countryCode} />
              <h3 className="text-lg font-bold text-white drop-shadow-lg">
                {card.pkg!.name.split("—")[0]?.trim() || card.country}
              </h3>
            </div>
          </Link>

          {/* Info */}
          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
              <span>{card.pkg!.data}</span>
              <span>{card.pkg!.duration}</span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                  €{card.pkg!.price.toFixed(2)}
                </span>
              </div>
              <Link
                href={`/bli/${card.pkg!.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-shqiponja px-4 py-2 text-xs font-bold text-white shadow-md shadow-shqiponja/25 transition hover:bg-shqiponja-dark hover:shadow-shqiponja/40"
              >
                {t("tourist.buy")}
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Share buttons */}
            <div className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-700">
              <span className="mr-auto text-[11px] font-medium uppercase tracking-wider text-zinc-400">{t("tourist.share")}</span>
              <a href={facebookShare(url)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2] transition hover:bg-[#1877F2] hover:text-white" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href={whatsappShare(url, text)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366] hover:text-white" aria-label="WhatsApp">
                <WhatsAppIcon />
              </a>
              <a href={telegramShare(url, text)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0088cc]/10 text-[#0088cc] transition hover:bg-[#0088cc] hover:text-white" aria-label="Telegram">
                <TelegramIcon />
              </a>
              <a href={twitterShare(url, text)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200/60 text-zinc-600 transition hover:bg-zinc-900 hover:text-white dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-zinc-900" aria-label="X">
                <XIcon />
              </a>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
