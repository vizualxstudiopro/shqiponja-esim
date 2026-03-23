import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politika e Privatësisë",
  description: "Si i mbrojmë të dhënat tuaja personale në Shqiponja eSIM.",
};

export default function PrivatesiaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
