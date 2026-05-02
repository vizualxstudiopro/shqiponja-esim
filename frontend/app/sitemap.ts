import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = "2026-05-02";

  return [
    { url: "https://shqiponjaesim.com/", lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: "https://shqiponjaesim.com/packages", lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://shqiponjaesim.com/about-us", lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: "https://shqiponjaesim.com/compatibility", lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: "https://shqiponjaesim.com/imprint", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://shqiponjaesim.com/terms", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://shqiponjaesim.com/privacy", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://shqiponjaesim.com/refund", lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
