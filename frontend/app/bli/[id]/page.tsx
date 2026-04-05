import { getPackageById, getPackages } from "@/lib/api";
import BuyPageContent from "./buy-content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pkg = await getPackageById(Number(id));
  if (!pkg) return { title: "Paketa nuk u gjet" };

  return {
    title: `${pkg.name} — ${pkg.data} për ${pkg.duration}`,
    description: `Bli paketën eSIM ${pkg.name} me ${pkg.data} të dhëna për ${pkg.duration}. Vetëm €${pkg.price}. Pa roaming, pa SIM fizike.`,
    openGraph: {
      title: `${pkg.name} — ${pkg.data} | Shqiponja eSIM`,
      description: `Paketë eSIM ${pkg.region}: ${pkg.data} për ${pkg.duration}, vetëm €${pkg.price}.`,
    },
  };
}

export default async function BliPage({ params }: Props) {
  const { id } = await params;
  const pkg = await getPackageById(Number(id));
  if (!pkg) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.name,
    description: `Paketë eSIM ${pkg.region}: ${pkg.data} për ${pkg.duration}`,
    offers: {
      "@type": "Offer",
      price: pkg.price,
      priceCurrency: pkg.currency || "EUR",
      availability: "https://schema.org/InStock",
      url: `https://shqiponjaesim.com/bli/${pkg.id}`,
    },
    brand: {
      "@type": "Brand",
      name: "Shqiponja eSIM",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BuyPageContent pkg={pkg} />
    </>
  );
}
