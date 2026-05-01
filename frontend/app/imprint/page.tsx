"use client";

import LegalPageShell from "@/components/legal-page-shell";

export default function ImprintPage() {
  return (
    <LegalPageShell contentClassName="mx-auto max-w-3xl px-6 py-16 text-zinc-700 dark:text-zinc-300">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Të Dhënat e Kompanisë (Imprint)</h1>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Informacioni Ligjor</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Emri Ligjor: VALA TECH 2026 LLC</li>
            <li>Forma: Limited Liability Company</li>
            <li>Brand: Shqiponja eSIM</li>
            <li>Përgjegjës: VALA TECH 2026 LLC</li>
            <li>Shteti i Regjistrimit: Wyoming, USA</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Adresa dhe Kontaktet</h2>
          <p>Adresa: 2232 Dell Range Blvd, Suite 303 1440, Cheyenne, WY 82009, United States</p>
          <p>
            Email: <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a>
          </p>
          <p>
            Tel: <a href="tel:+13072262252" className="text-shqiponja hover:underline">+1 307 226 2252</a>
          </p>
          <p>
            Website: <a href="https://shqiponjaesim.com" className="text-shqiponja hover:underline">https://shqiponjaesim.com</a>
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Zgjidhja e Mosmarrëveshjeve</h2>
          <p>
            Për çdo ankesë ose mosmarrëveshje, ju lutem na kontaktoni në <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a>.
            Ne përgjigjemi brenda 48 orësh.
          </p>
        </section>
    </LegalPageShell>
  );
}
