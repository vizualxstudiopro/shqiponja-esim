import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rreth Nesh",
  description: "Mëso më shumë rreth Shqiponja eSIM — platforma shqiptare për paketa eSIM ndërkombëtare në mbi 190 vende.",
};

export default function RrethLayout({ children }: { children: React.ReactNode }) {
  return children;
}
