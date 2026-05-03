import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountriesByContinent, getPackagesByCountry } from "@/lib/api";

interface Props {
  params: Promise<{ countryCode: string }>;
}

function pickCountryNameFromPackageName(name: string): string {
  return (name || "").split(" — ")[0] || "Country";
}

async function getCountryNameMap(): Promise<Record<string, string>> {
  const countries = await getCountriesByContinent();
  const map: Record<string, string> = {};

  Object.values(countries.countries || {}).forEach((list) => {
    list.forEach((country) => {
      if (country.country_code) {
        map[country.country_code.toUpperCase()] = country.name;
      }
    });
  });

  return map;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params;
  const cc = countryCode.toUpperCase();

  const [nameMap, packages] = await Promise.all([
    getCountryNameMap(),
    getPackagesByCountry(cc),
  ]);

  if (!packages.length) {
    return {
      title: "Country eSIM Packages Not Found | Shqiponja eSIM",
      robots: { index: false, follow: true },
    };
  }

  const countryName = nameMap[cc] || pickCountryNameFromPackageName(packages[0].name);
  const minPrice = Math.min(...packages.map((pkg) => Number(pkg.price) || 0));

  return {
    title: `Best eSIM for ${countryName} - High Speed Data | Shqiponja eSIM`,
    description: `Find the best eSIM plans for ${countryName}. Instant activation, high speed mobile data, starting from €${minPrice.toFixed(2)}.`,
    alternates: {
      canonical: `https://shqiponjaesim.com/packages/${cc.toLowerCase()}`,
    },
    openGraph: {
      title: `Best eSIM for ${countryName} - High Speed Data | Shqiponja eSIM`,
      description: `Top eSIM deals for ${countryName}, from €${minPrice.toFixed(2)}. Buy online in seconds.`,
      url: `https://shqiponjaesim.com/packages/${cc.toLowerCase()}`,
      siteName: "Shqiponja eSIM",
      type: "website",
    },
  };
}

export async function generateStaticParams() {
  const countries = await getCountriesByContinent();
  const countryCodes = new Set<string>();

  Object.values(countries.countries || {}).forEach((list) => {
    list.forEach((country) => {
      if (country.country_code) countryCodes.add(country.country_code.toLowerCase());
    });
  });

  return Array.from(countryCodes).map((countryCode) => ({ countryCode }));
}

export default async function CountryPackagesPage({ params }: Props) {
  const { countryCode } = await params;
  const cc = countryCode.toUpperCase();

  const [nameMap, packages] = await Promise.all([
    getCountryNameMap(),
    getPackagesByCountry(cc),
  ]);

  if (!packages.length) notFound();

  const countryName = nameMap[cc] || pickCountryNameFromPackageName(packages[0].name);
  const minPrice = Math.min(...packages.map((pkg) => Number(pkg.price) || 0));

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best eSIM for ${countryName}`,
    itemListElement: packages.map((pkg, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Product",
        name: pkg.name,
        description: pkg.description || `eSIM plan for ${countryName}`,
        offers: {
          "@type": "Offer",
          priceCurrency: pkg.currency || "EUR",
          price: Number(pkg.price).toFixed(2),
          availability: "https://schema.org/InStock",
          url: `https://shqiponjaesim.com/bli/${pkg.id}`,
        },
      },
    })),
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
        Best eSIM for {countryName}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        High speed data plans for {countryName}. Prices start from €{minPrice.toFixed(2)}.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <article key={pkg.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{pkg.name}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{pkg.description || `${pkg.data} for ${pkg.duration}`}</p>
            <p className="mt-4 text-2xl font-extrabold text-shqiponja">€{Number(pkg.price).toFixed(2)}</p>
            <p className="mt-1 text-xs text-zinc-500">{pkg.data} · {pkg.duration}</p>
            <Link
              href={`/bli/${pkg.id}`}
              className="mt-5 inline-block rounded-xl bg-shqiponja px-4 py-2 text-sm font-semibold text-white hover:bg-shqiponja-dark"
            >
              Bli tani
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
