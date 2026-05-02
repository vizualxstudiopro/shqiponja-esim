import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hyr në Llogari",
  description: "Kyçu në llogarinë tënde Shqiponja eSIM për të menaxhuar paketat dhe porositë e tua eSIM.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://shqiponjaesim.com/hyr" },
};

export default function HyrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
