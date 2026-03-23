import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rreth Nesh",
  description: "Mëso më shumë rreth Shqiponja eSIM — platforma për paketa eSIM ndërkombëtare.",
};

export default function RrethLayout({ children }: { children: React.ReactNode }) {
  return children;
}
