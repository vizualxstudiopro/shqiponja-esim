import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Shqiponja eSIM",
  description: "Artikuj dhe udhëzues rreth eSIM, udhëtimit, dhe teknologjisë.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
