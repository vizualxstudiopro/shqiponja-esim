import { getPackages, type EsimPackage } from "@/lib/api";
import Navbar from "@/components/navbar";
import LandingContent from "@/components/landing-content";

export default async function Home() {
  const packages: EsimPackage[] = await getPackages();

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />
      <LandingContent packages={packages} />
    </div>
  );
}
