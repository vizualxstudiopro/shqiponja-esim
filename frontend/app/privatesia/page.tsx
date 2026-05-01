"use client";

import Navbar from "@/components/navbar";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-extrabold">Politika e Privatësisë</h1>
        <p className="mt-2 text-sm text-zinc-500">Përditësuar për herë të fundit: 1 Maj 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">1. Të dhënat që mbledhim</h2>
            <p className="mt-2">Mbledhim të dhëna bazë si emri, email-i, informacioni i porosisë dhe të dhëna teknike të nevojshme për funksionimin e shërbimit Shqiponja eSIM.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">2. Si i përdorim të dhënat</h2>
            <p className="mt-2">Të dhënat përdoren për procesimin e porosive, dërgimin e eSIM, mbështetje ndaj klientit, parandalim abuzimi dhe përmirësim të platformës.</p>
            <p className="mt-2"><strong>Baza ligjore për përpunimin:</strong> Përpunojmë të dhënat tuaja mbi bazën e ekzekutimit të kontratës kur blini një eSIM, interesit legjitim për parandalimin e mashtrimit dhe sigurinë e platformës, dhe pëlqimit tuaj për komunikime marketingu dhe cookies jo-esenciale.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">3. Ruajtja dhe siguria</h2>
            <p className="mt-2">Aplikojmë masa teknike dhe organizative të arsyeshme për të mbrojtur të dhënat personale dhe për të kufizuar qasjen e paautorizuar.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">4. Cookies</h2>
            <p className="mt-2">Përdorim cookies esenciale, analitike dhe funksionale sipas zgjedhjes suaj të konsentit. Për detaje, shihni Cookie Policy.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">5. Kontakt</h2>
            <p className="mt-2">Për pyetje rreth privatësisë: <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Kontrolluesi i të Dhënave</h2>
            <p className="mt-2">VALA TECH 2026 LLC, 2232 Dell Range Blvd, Suite 303 1440, Cheyenne, WY 82009, USA.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Transferimi i të Dhënave</h2>
            <p className="mt-2">Të dhënat personale mund të përpunohen dhe ruhen në Shtetet e Bashkuara të Amerikës (USA).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Të Drejtat Tuaja GDPR</h2>
            <p className="mt-2">Ju keni të drejtë për akses, korrigjim dhe fshirje të të dhënave tuaja personale. Për ushtrimin e këtyre të drejtave, na kontaktoni në <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Pagesat</h2>
            <p className="mt-2">Pagesat procesohen nga Stripe dhe PayPal. Ne nuk ruajmë të dhëna të kartave bankare në sistemet tona.</p>
            <p className="mt-2">Nuk i shesim, japim me qira, ose ndajmë të dhënat tuaja personale me palë të treta për qëllime marketingu.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
