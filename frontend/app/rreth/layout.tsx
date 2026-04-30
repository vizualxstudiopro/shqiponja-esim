import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rreth Nesh",
  description: "Mëso më shumë rreth Shqiponja eSIM — platforma shqiptare për paketa eSIM ndërkombëtare në mbi 190 vende.",
  alternates: { canonical: "https://shqiponjaesim.com/rreth" },
};

export default function RrethLayout({ children }: { children: React.ReactNode }) {
  return children;
}
