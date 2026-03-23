import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hyr",
  description: "Kyçu në llogarinë tënde Shqiponja eSIM.",
};

export default function HyrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
