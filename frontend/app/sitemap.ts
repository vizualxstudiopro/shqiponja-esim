import type { MetadataRoute } from "next";
import { getCountriesByContinent, getPackages } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = "2026-05-02";
  const baseUrl = "https://shqiponjaesim.com";

  const packages = await getPackages();
  const countries = await getCountriesByContinent();

  const countryCodes = new Set<string>();
  Object.values(countries.countries || {}).forEach((list) => {
    list.forEach((country) => {
      if (country.country_code) countryCodes.add(country.country_code.toLowerCase());
    });
  });

  const packageUrls: MetadataRoute.Sitemap = packages.map((pkg) => ({
    url: `${baseUrl}/bli/${pkg.id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const countryUrls: MetadataRoute.Sitemap = Array.from(countryCodes).map((cc) => ({
    url: `${baseUrl}/packages/${cc}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/packages`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about-us`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/compatibility`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/imprint`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/refund`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    ...countryUrls,
    ...packageUrls,
  ];
}
