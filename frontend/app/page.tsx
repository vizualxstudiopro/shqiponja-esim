import { getPackages, type EsimPackage } from "@/lib/api";
import Navbar from "@/components/navbar";
import LandingContent from "@/components/landing-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  let packages: EsimPackage[] = [];
  try {
    packages = await getPackages();
  } catch { /* API not available during build */ }

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />
      <LandingContent packages={packages} />
    </div>
  );
}
