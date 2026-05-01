"use client";

import Navbar from "@/components/navbar";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-extrabold">Kushtet e Përdorimit</h1>
        <p className="mt-2 text-sm text-zinc-500">Përditësuar për herë të fundit: 1 Maj 2026</p>

        <p className="mt-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          Operatori: Ky shërbim ofrohet nga VALA TECH 2026 LLC, Wyoming, USA.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">1. Pranimi i kushteve</h2>
            <p className="mt-2">Duke përdorur Shqiponja eSIM, ju pranoni këto kushte përdorimi.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">2. Shërbimi</h2>
            <p className="mt-2">Shqiponja eSIM ofron paketa dixhitale eSIM për internet mobil ndërkombëtar.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">3. Pagesat dhe rimbursimet</h2>
            <p className="mt-2">Pagesat përpunohen nga partnerët tanë të pagesave. Rimbursimet zbatohen sipas politikës së kthimeve.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">4. Përgjegjësia</h2>
            <p className="mt-2">Nuk mbajmë përgjegjësi për ndërprerje të rrjeteve të palëve të treta jashtë kontrollit tonë.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">5. Ndryshimet e kushteve</h2>
            <p className="mt-2">Rezervojmë të drejtën të përditësojmë këto kushte në çdo kohë.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Disclaimer për eSIM</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>eSIM është produkt dixhital, jo kartë fizike.</li>
              <li>Shërbimi është vetëm për të dhëna interneti, jo për thirrje/SMS tradicionale.</li>
              <li>Klienti duhet të kontrollojë kompatibilitetin e pajisjes përpara blerjes.</li>
              <li>Nevojitet lidhje interneti për aktivizimin fillestar të eSIM-it.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
