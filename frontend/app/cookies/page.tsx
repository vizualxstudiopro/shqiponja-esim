"use client";

import LegalPageShell from "@/components/legal-page-shell";

export default function CookiesPage() {
  return (
    <LegalPageShell contentClassName="mx-auto max-w-3xl px-6 py-16 text-zinc-700 dark:text-zinc-300">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Cookie Policy - Përditësuar 1 Maj 2026</h1>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Përdorimi i Cookies</h2>
          <p>
            VALA TECH 2026 LLC, operator i markës Shqiponja eSIM, përdor cookies për funksionimin e faqes,
            matjen e performancës dhe përmirësimin e eksperiencës së përdoruesit.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Cookies esenciale për funksionimin bazë të platformës.</li>
            <li>Cookies analitike nga Google Analytics.</li>
            <li>Cookies marketingu nga Meta Pixel.</li>
            <li>Cookies funksionale për chat dhe mbështetje klienti.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Menaxhimi i Cookies</h2>
          <p>
            Ju mund të pranoni ose refuzoni cookies jo-esenciale përmes banner-it të cookies. Zgjedhja ruhet në
            pajisjen tuaj dhe mund të ndryshohet duke fshirë të dhënat lokale të shfletuesit.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Palët e Treta</h2>
          <p>Shërbimet e mëposhtme mund të vendosin ose lexojnë cookies sipas funksionalitetit të tyre:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Stripe</li>
            <li>PayPal</li>
            <li>Google</li>
            <li>Meta</li>
            <li>Airalo</li>
          </ul>
        </section>

        <section className="mt-8 space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Kontakt</h2>
          <p>Email: <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a></p>
          <p>Adresa: VALA TECH 2026 LLC, 2232 Dell Range Blvd, Suite 303 1440, Cheyenne, WY 82009, USA</p>
        </section>
    </LegalPageShell>
  );
}
