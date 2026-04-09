"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPackages, type EsimPackage } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

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
      {cards.map((card) => (
        <Link
          key={card.countryCode}
          href={`/bli/${card.pkg!.id}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 dark:border-zinc-700 dark:bg-zinc-800"
        >
          {/* Image */}
          <div className="relative h-44 overflow-hidden">
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
          </div>

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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-shqiponja px-4 py-2 text-xs font-bold text-white shadow-md shadow-shqiponja/25 transition group-hover:bg-shqiponja-dark group-hover:shadow-shqiponja/40">
                {t("tourist.buy")}
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
