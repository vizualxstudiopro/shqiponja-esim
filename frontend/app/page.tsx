import { getPackages } from "@/lib/api";
import Navbar from "@/components/navbar";
import LandingContent from "@/components/landing-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const packages = await getPackages();

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />
      <LandingContent packages={packages} />
    </div>
  );
}
