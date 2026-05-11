"use client";

import { useI18n } from "@/lib/i18n-context";
import LegalPageShell from "@/components/legal-page-shell";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Shqiponja eSIM",
  legalName: "VALA TECH 2026 LLC",
  url: "https://shqiponjaesim.com",
  logo: "https://shqiponjaesim.com/logo.png",
  foundingDate: "2026",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2232 Dell Range Blvd, Suite 303 1440",
    addressLocality: "Cheyenne",
    addressRegion: "WY",
    postalCode: "82009",
    addressCountry: "US",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-307-226-2252",
    contactType: "customer service",
    email: "info@shqiponjaesim.com",
    availableLanguage: ["Albanian", "English"],
  },
  sameAs: ["https://shqiponjaesim.com"],
};

export default function AboutPage() {
  const { t, locale } = useI18n();
  const isEn = locale === "en";
  const highlights = [
    {
      title: isEn ? "Platform" : "Platforma",
      value: isEn
        ? "Shqiponja eSIM — operated by Vala Tech 2026 LLC"
        : "Shqiponja eSIM — operohet nga Vala Tech 2026 LLC",
    },
    {
      title: isEn ? "Mission" : "Misioni",
      value: isEn
        ? "Affordable internet for the Albanian diaspora across the world"
        : "Internet i përballueshëm për diasporën shqiptare në mbarë botën",
    },
    {
      title: isEn ? "Partner" : "Partneri",
      value: isEn ? "Official Airalo Partner" : "Partneri zyrtar i Airalo",
    },
    {
      title: isEn ? "Languages" : "Gjuha",
      value: isEn ? "Albanian and English" : "Shqip (shqip) dhe anglisht",
    },
  ];

  return (
    <LegalPageShell contentClassName="mx-auto max-w-5xl px-6 py-16 text-zinc-700 dark:text-zinc-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <section className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="bg-gradient-to-br from-shqiponja/12 via-transparent to-zinc-100 px-8 py-12 dark:to-zinc-950">
          <span className="inline-flex rounded-full border border-shqiponja/20 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-shqiponja dark:bg-zinc-950/70">
            {isEn ? "About Us" : "Rreth Nesh"}
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl dark:text-white">
            {isEn ? "About Shqiponja eSIM" : "Rreth Shqiponja eSIM"}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
            {isEn
              ? "Shqiponja eSIM is a travel connectivity platform operated by Vala Tech 2026 LLC. We focus on making mobile internet simpler, faster, and more affordable for Albanians living and traveling around the world."
              : "Shqiponja eSIM është një platformë për lidhje interneti në udhëtim, e operuar nga Vala Tech 2026 LLC. Ne fokusohemi ta bëjmë internetin mobil më të thjeshtë, më të shpejtë dhe më të përballueshëm për shqiptarët që jetojnë dhe udhëtojnë në mbarë botën."}
          </p>
        </div>

        <div className="grid gap-4 border-t border-zinc-200 px-8 py-8 sm:grid-cols-2 xl:grid-cols-4 dark:border-zinc-800">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-8 text-sm leading-8 text-zinc-600 dark:text-zinc-300">
            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {isEn ? "Our Mission" : "Misioni Ynë"}
              </h2>
              <p className="mt-3">
                {isEn
                  ? "Our mission is affordable internet for the Albanian diaspora around the world. We want travelers, families, professionals, and students to land in a new country and connect immediately, without depending on expensive roaming or local SIM logistics."
                  : "Misioni ynë është internet i përballueshëm për diasporën shqiptare në mbarë botën. Ne duam që udhëtarët, familjet, profesionistët dhe studentët të mbërrijnë në një vend të ri dhe të lidhen menjëherë, pa u varur nga roaming-u i shtrenjtë ose nga logjistika e kartave lokale SIM."}
              </p>
              <p className="mt-3">
                {isEn
                  ? "Through Shqiponja eSIM, operated by Vala Tech 2026 LLC, we package simple digital connectivity into a clear experience: transparent pricing, instant delivery, Albanian-language support, and a product built for real travel use cases."
                  : "Përmes Shqiponja eSIM, e operuar nga Vala Tech 2026 LLC, ne e kthejmë lidhjen digjitale në një eksperiencë të qartë: çmime transparente, dorëzim të menjëhershëm, mbështetje në shqip dhe një produkt të ndërtuar për nevoja reale udhëtimi."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {isEn ? "Who We Are" : "Kush Jemi"}
              </h2>
              <p className="mt-3">
                {isEn
                  ? "Shqiponja eSIM is operated by Vala Tech 2026 LLC and serves as a focused platform for international eSIM packages. Our goal is not to overwhelm users with technical complexity, but to give them a direct path to reliable data plans before and during travel."
                  : "Shqiponja eSIM operohet nga Vala Tech 2026 LLC dhe shërben si një platformë e fokusuar për paketa ndërkombëtare eSIM. Qëllimi ynë nuk është t'i ngarkojmë përdoruesit me kompleksitet teknik, por t'u japim një rrugë të drejtpërdrejtë drejt planeve të besueshme të internetit para dhe gjatë udhëtimit."}
              </p>
              <p className="mt-3">
                {isEn
                  ? "We are also an official Airalo partner, which helps us offer broad destination coverage and dependable package availability for Albanian-speaking customers looking for a modern alternative to roaming."
                  : "Ne jemi gjithashtu partneri zyrtar i Airalo, gjë që na ndihmon të ofrojmë mbulim të gjerë destinacionesh dhe disponueshmëri të besueshme paketash për klientët shqipfolës që kërkojnë një alternativë moderne ndaj roaming-ut."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {isEn ? "Why the Platform Exists" : "Pse Ekziston Platforma"}
              </h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <strong className="text-zinc-900 dark:text-white">{isEn ? "Clarity" : "Qartësi"}</strong>
                  {isEn
                    ? " — understandable package choices, transparent pricing, and a buying experience designed for speed."
                    : " — zgjedhje të kuptueshme paketash, çmime transparente dhe një eksperiencë blerjeje e ndërtuar për shpejtësi."}
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">{isEn ? "Affordability" : "Përballueshmëri"}</strong>
                  {isEn
                    ? " — lower-friction internet access for Albanians abroad, without unnecessary travel connectivity costs."
                    : " — akses më i thjeshtë në internet për shqiptarët jashtë vendit, pa kosto të panevojshme lidhjeje gjatë udhëtimit."}
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-white">{isEn ? "Language accessibility" : "Qasje gjuhësore"}</strong>
                  {isEn
                    ? " — support and content in Albanian and English for customers who want confidence, not guesswork."
                    : " — mbështetje dhe përmbajtje në shqip dhe anglisht për klientët që duan siguri, jo hamendësime."}
                </li>
              </ul>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                {isEn ? "Company Details" : "Të Dhënat e Kompanisë"}
              </p>
              <dl className="mt-4 space-y-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                <div>
                  <dt className="font-semibold text-zinc-900 dark:text-white">{isEn ? "Company" : "Kompania"}</dt>
                  <dd>Vala Tech 2026 LLC</dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-900 dark:text-white">{isEn ? "Address" : "Adresa"}</dt>
                  <dd>2232 Dell Range Blvd, Suite 303 1440, Cheyenne, WY 82009</dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-900 dark:text-white">{isEn ? "Platform" : "Platforma"}</dt>
                  <dd>{isEn ? "Shqiponja eSIM — operated by Vala Tech 2026 LLC" : "Shqiponja eSIM — operohet nga Vala Tech 2026 LLC"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-900 dark:text-white">{isEn ? "Language" : "Gjuha"}</dt>
                  <dd>{isEn ? "Albanian and English" : "Shqip (shqip) anglisht"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-shqiponja/20 bg-shqiponja/5 p-6 dark:bg-shqiponja/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-shqiponja">
                {isEn ? "Official Partner" : "Partner Zyrtar"}
              </p>
              <h2 className="mt-3 text-lg font-bold text-zinc-900 dark:text-white">Airalo</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {isEn
                  ? "Shqiponja eSIM works as an official Airalo partner to provide trusted destination coverage and reliable access to international eSIM packages."
                  : "Shqiponja eSIM punon si partneri zyrtar i Airalo për të ofruar mbulim të besueshëm destinacionesh dhe akses të qëndrueshëm në paketa ndërkombëtare eSIM."}
              </p>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                {isEn ? "Contact" : "Kontakt"}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                <p>
                  <strong className="text-zinc-900 dark:text-white">Email:</strong>{" "}
                  <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a>
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">Tel:</strong>{" "}
                  <a href="tel:+13072262252" className="text-shqiponja hover:underline">+1 307 226 2252</a>
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">{isEn ? "Imprint" : "Imprint"}:</strong>{" "}
                  <a href="/imprint" className="text-shqiponja hover:underline">VALA TECH 2026 LLC</a>
                </p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </LegalPageShell>
  );
}
