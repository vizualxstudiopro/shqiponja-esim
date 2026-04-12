import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Si të Instaloni eSIM — Guida Hap-pas-Hapi",
  description:
    "Mësoni si të instaloni dhe aktivizoni eSIM-in tuaj në iPhone dhe Android. Udhëzime të thjeshta hap-pas-hapi.",
  alternates: { canonical: "https://shqiponjaesim.com/instalimi" },
};

export default function InstallGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
