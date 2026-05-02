/**
 * Server component — renders the hero section with static Albanian text.
 * This ensures the LCP element (h1) is in the HTML from the server,
 * not delayed by client-side JS / i18n hydration.
 */
export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-shqiponja/10 blur-3xl animate-glow" />
      <div className="pointer-events-none absolute -bottom-60 -left-40 h-[400px] w-[400px] rounded-full bg-shqiponja/5 blur-3xl animate-glow delay-300" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-28 text-center lg:py-40">
        <span className="mb-6 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-zinc-300">
          eSIM NDËRKOMBËTARE — PA KONTRATË
        </span>

        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Lidhu me botën menjëherë me{" "}
          <span className="text-shqiponja">Shqiponja eSIM</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
          Bli paketa eSIM ndërkombëtare nga operatorët më të mëdhenj. Interneti kudo pa roaming, pa SIM fizike.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="/#packages"
            className="group rounded-full bg-shqiponja px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-shqiponja/30 hover:bg-shqiponja-dark hover:shadow-shqiponja/50 transition-all duration-300 hover:scale-105"
          >
            Bli Tani →
          </a>
          <a
            href="/#how"
            className="rounded-full border border-white/15 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/5 hover:border-white/30 transition-all duration-300"
          >
            Si Funksionon?
          </a>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-10 text-center">
          <div>
            <p className="text-2xl font-bold sm:text-3xl">190+</p>
            <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wide">VENDE</p>
          </div>
          <div>
            <p className="text-2xl font-bold sm:text-3xl">24/7</p>
            <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wide">MBËSHTETJE</p>
          </div>
          <div>
            <p className="text-2xl font-bold sm:text-3xl">99.9%</p>
            <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wide">UPTIME</p>
          </div>
        </div>
      </div>
    </section>
  );
}
