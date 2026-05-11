import { Metadata } from "next";
import Navbar from "@/components/navbar";
import PackageGrid from "@/components/package-grid";
import Footer from "@/components/footer";
import { getPackages, type EsimPackage } from "@/lib/api";

export const metadata: Metadata = {
  title: "Paketa eSIM Shqiponja | 190+ Vende",
  description: "Zgjidh paketën eSIM për Europë, SHBA, Azi. Aktivizim i menjëhershëm. Internet i shpejtë në mbi 190 vende.",
  alternates: {
    canonical: "https://shqiponjaesim.com/packages",
  },
};

function buildProductSchema(packages: EsimPackage[]) {
  return {
    "@context": "https://schema.org",
    "@graph": packages.map((pkg) => ({
      "@type": "Product",
      name: pkg.name,
      category: "Telecommunications Services",
      brand: {
        "@type": "Brand",
        name: "Shqiponja eSIM",
      },
      seller: {
        "@type": "Organization",
        name: "VALA TECH 2026 LLC",
      },
      offers: {
        "@type": "Offer",
        url: `https://shqiponjaesim.com/bli/${pkg.id}`,
        priceCurrency: "EUR",
        price: Number(pkg.price).toFixed(2),
        availability: "https://schema.org/InStock",
      },
    })),
  };
}

export default async function PackagesPage() {
  const packages = await getPackages();
  const productSchema = buildProductSchema(packages);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-3">
              Paketa eSIM
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Zgjidh paketën perfekte për udhëtimin tënd
            </p>
          </div>
          <PackageGrid initialPackages={packages} />
        </div>
      </main>
      <Footer />
    </>
  );
}
