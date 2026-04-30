import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakti",
  description: "Na kontakto për çdo pyetje, ndihmë teknike ose sugjerim rreth paketave eSIM dhe shërbimeve tona.",
  alternates: { canonical: "https://shqiponjaesim.com/kontakti" },
};

export default function KontaktiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
