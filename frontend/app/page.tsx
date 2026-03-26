import { getPackages } from "@/lib/api";
import Navbar from "@/components/navbar";
import LandingContent from "@/components/landing-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const packages = await getPackages();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ballina", item: "https://shqiponjaesim.com" },
    ],
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Shqiponja eSIM",
    url: "https://shqiponjaesim.com",
    description: "Bli paketa eSIM ndërkombëtare nga operatorët më të mëdhenj.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://shqiponjaesim.com/?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="flex flex-col min-h-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }} />
      <Navbar />
      <LandingContent packages={packages} />
    </div>
  );
}
