import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakti",
  description: "Na kontakto për çdo pyetje apo ndihmë rreth paketave eSIM.",
};

export default function KontaktiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
