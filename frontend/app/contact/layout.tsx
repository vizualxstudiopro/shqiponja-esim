import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact VALA TECH 2026 LLC at our Cheyenne, Wyoming office for support, legal details, and eSIM service inquiries.",
  alternates: { canonical: "https://shqiponjaesim.com/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
