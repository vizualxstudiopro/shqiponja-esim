import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/profili", "/porosi/", "/verifiko", "/rivendos-fjalekalimin"],
      },
    ],
    sitemap: "https://shqiponja-esim.com/sitemap.xml",
  };
}
