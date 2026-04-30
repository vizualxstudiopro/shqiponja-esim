import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politika e Rimbursimit",
  description: "Politika e rimbursimit dhe kthimit të Shqiponja eSIM.",
  alternates: { canonical: "https://shqiponjaesim.com/rimbursimet" },
};

export default function RimbursimetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
