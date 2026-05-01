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

  return (
    <LegalPageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {isEn ? "About Shqiponja eSIM" : "Rreth Shqiponja eSIM"}
      </h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">

        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {isEn ? "Our Mission" : "Misioni Ynë"}
          </h2>
          <p className="mt-2">
            {isEn
              ? "Our mission is to connect Albanians with the world — no borders, no roaming, no physical SIM. Shqiponja eSIM was founded to offer Albanian travelers fast and affordable internet anywhere in the world."
              : "Misioni ynë është të lidhim shqiptarët me botën — pa kufij, pa roaming, pa SIM fizike. Shqiponja eSIM u themelua për t'u ofruar udhëtarëve shqiptarë internet të shpejtë dhe të përballueshëm kudo në botë."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {isEn ? "Who We Are" : "Kush Jemi"}
          </h2>
          <p className="mt-2">
            {isEn ? (
              <>Shqiponja eSIM is the brand of <strong>VALA TECH 2026 LLC</strong>, a company registered in Wyoming, USA. We are an <strong>Official Airalo Partner</strong>, the world&apos;s largest eSIM platform with coverage in 190+ countries.</>
            ) : (
              <>Shqiponja eSIM është brand i <strong>VALA TECH 2026 LLC</strong>, një kompani e regjistruar në Wyoming, SHBA. Ne jemi <strong>Partner Zyrtar i Airalo</strong>, platformës më të madhe eSIM në botë me mbulim në 190+ vende.</>
            )}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {isEn ? "Our Values" : "Vlerat Tona"}
          </h2>
          <ul className="mt-2 space-y-2 list-none pl-0">
            <li><strong>{isEn ? "Transparency" : "Transparencë"}</strong> — {isEn ? "Clear prices, no hidden fees" : "Çmime të qarta, pa tarifa të fshehura"}</li>
            <li><strong>{isEn ? "Quality" : "Cilësi"}</strong> — {isEn ? "Coverage in 190+ countries with 4G/5G network" : "Mbulim në 190+ vende me rrjet 4G/5G"}</li>
            <li><strong>{isEn ? "Support" : "Mbështetje"}</strong> — {isEn ? "Dedicated customer team, 24/7" : "Ekip i dedikuar për klientët, 24/7"}</li>
            <li><strong>{isEn ? "Reliability" : "Besueshmëri"}</strong> — {isEn ? "Secure payments via Stripe and PayPal" : "Pagesa të sigurta përmes Stripe dhe PayPal"}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {isEn ? "Why Choose Us" : "Pse të Na Zgjidhni"}
          </h2>
          <p className="mt-2">
            {isEn ? (
              <>
                1. <strong>Instant activation</strong> — Scan the QR code and connect in 2 minutes<br />
                2. <strong>No contract</strong> — Buy only what you need, when you need it<br />
                3. <strong>Albanian support</strong> — Our team helps you in your language
              </>
            ) : (
              <>
                1. <strong>Aktivizim i menjëhershëm</strong> — Skano QR kodin dhe lidhu për 2 minuta<br />
                2. <strong>Pa kontratë</strong> — Bli vetëm sa të duhet, kur të duhet<br />
                3. <strong>Mbështetje në shqip</strong> — Ekipi ynë të ndihmon në gjuhën tënde
              </>
            )}
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p>
            <strong>{isEn ? "Contact:" : "Kontakt:"}</strong>{" "}
            <a href="mailto:info@shqiponjaesim.com" className="text-shqiponja hover:underline">info@shqiponjaesim.com</a>
            {" | "}
            <a href="tel:+13072262252" className="text-shqiponja hover:underline">+1 307 226 2252</a>
          </p>
          <p className="mt-1">
            <strong>{isEn ? "Company:" : "Kompania:"}</strong>{" "}
            <a href="/imprint" className="text-shqiponja hover:underline">VALA TECH 2026 LLC</a>
          </p>
        </section>

      </div>
    </LegalPageShell>
  );
}
