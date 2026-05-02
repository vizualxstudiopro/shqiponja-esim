import { Metadata } from "next";
import Navbar from "@/components/navbar";
import PackageGrid from "@/components/package-grid";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Paketa eSIM Shqiponja | 190+ Vende",
  description: "Zgjidh paketën eSIM për Europë, SHBA, Azi. Aktivizim i menjëhershëm. Internet i shpejtë në mbi 190 vende.",
  alternates: {
    canonical: "https://shqiponjaesim.com/",
  },
};

export default function PackagesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-3">
              Paketa eSIM
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Zgjidh paketën perfekte për udhëtimin tënd
            </p>
          </div>
          <PackageGrid />
        </div>
      </main>
      <Footer />
    </>
  );
}
