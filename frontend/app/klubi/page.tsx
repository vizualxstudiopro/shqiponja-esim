import Navbar from "@/components/navbar";
import EagleExperienceDashboard from "@/components/eagle-experience-dashboard";
import Link from "next/link";

export default function KlubPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-950">
      <Navbar />
      <div className="mx-auto mt-6 flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 md:px-6">
        <Link
          href="/klubi"
          className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200"
        >
          Eagle Experience
        </Link>
        <Link
          href="/klubi/ekipi"
          className="rounded-full border border-[#e8333a]/40 bg-[#e8333a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e8333a]"
        >
          Ekipi 3D
        </Link>
      </div>
      <EagleExperienceDashboard />
    </div>
  );
}
