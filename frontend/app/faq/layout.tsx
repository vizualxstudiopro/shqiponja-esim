import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pyetje të Shpeshta (FAQ)",
  description: "Gjej përgjigje për pyetjet më të shpeshta rreth paketave eSIM, aktivizimit, çmimeve dhe mbulimit global të Shqiponja eSIM.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Çfarë është eSIM?",
      acceptedAnswer: { "@type": "Answer", text: "eSIM është një SIM dixhitale që të lejon të aktivizosh një plan celular pa pasur nevojë për SIM fizike." },
    },
    {
      "@type": "Question",
      name: "Si e instaloj eSIM-in?",
      acceptedAnswer: { "@type": "Answer", text: "Pas blerjes, do të marrësh një QR kod. Skanoje nga Cilësimet > Celular > Shto Plan eSIM në telefonin tënd." },
    },
    {
      "@type": "Question",
      name: "A funksionon me telefonin tim?",
      acceptedAnswer: { "@type": "Answer", text: "eSIM funksionon me shumicën e telefonave të rinj: iPhone XS+, Samsung Galaxy S20+, Google Pixel 3+ etj." },
    },
    {
      "@type": "Question",
      name: "A mund ta përdor njëkohësisht me SIM-in fizike?",
      acceptedAnswer: { "@type": "Answer", text: "Po! Shumica e telefonave mbështesin Dual SIM — mund ta përdorësh eSIM-in për internet dhe SIM fizike për thirrje." },
    },
    {
      "@type": "Question",
      name: "Çfarë ndodh kur perfundon plani?",
      acceptedAnswer: { "@type": "Answer", text: "Kur përfundon plani, interneti ndalet automatikisht. Mund të blesh një plan të ri në çdo kohë." },
    },
  ],
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}
