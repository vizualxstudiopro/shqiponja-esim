import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hyr në Llogari",
  description: "Kyçu në llogarinë tënde Shqiponja eSIM për të menaxhuar paketat dhe porositë e tua eSIM.",
};

export default function HyrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
