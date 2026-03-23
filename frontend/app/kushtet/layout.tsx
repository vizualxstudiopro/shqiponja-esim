import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kushtet e Përdorimit",
  description: "Kushtet e përdorimit të platformës Shqiponja eSIM.",
};

export default function KushtetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
