import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pyetje të Shpeshta (FAQ)",
  description: "Gjej përgjigje për pyetjet më të shpeshta rreth paketave eSIM, aktivizimit, çmimeve dhe mbulimit global të Shqiponja eSIM.",
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
