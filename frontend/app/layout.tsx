import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast-context";
import { CurrencyProvider } from "@/lib/currency-context";
import AnalyticsBootstrap from "@/components/analytics-bootstrap";
import LiveChatVisibility from "@/components/live-chat-visibility";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shqiponjaesim.com"),
  title: {
    default: "Shqiponja eSIM — Lidhu me botën menjëherë",
    template: "%s | Shqiponja eSIM",
  },
  description:
    "Bli paketa eSIM ndërkombëtare nga operatorët më të mëdhenj. Interneti kudo pa roaming, pa SIM fizike.",
  alternates: {
    canonical: "https://shqiponjaesim.com",
  },
  openGraph: {
    type: "website",
    locale: "sq_AL",
    siteName: "Shqiponja eSIM",
    title: "Shqiponja eSIM — Lidhu me botën menjëherë",
    description: "Bli paketa eSIM ndërkombëtare. Interneti kudo pa roaming, pa SIM fizike.",
    url: "https://shqiponjaesim.com",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Shqiponja eSIM — Paketa eSIM ndërkombëtare",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shqiponja eSIM — Lidhu me botën menjëherë",
    description: "Bli paketa eSIM ndërkombëtare. Interneti kudo pa roaming, pa SIM fizike.",
    images: ["/opengraph-image"],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sq"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="google-site-verification" content="ygDyTLL2Ia1Hv0LP0TLjKlmTH1AtF14Y-db2DVIvfPA" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Shqiponja eSIM",
              url: "https://shqiponjaesim.com",
              logo: "https://shqiponjaesim.com/opengraph-image",
              description: "Platformë e-commerce për shitjen e paketave eSIM ndërkombëtare.",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                url: "https://shqiponjaesim.com/kontakti",
              },
              sameAs: [],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VALA TECH 2026 LLC",
  "legalName": "VALA TECH 2026 LLC",
  "url": "https://shqiponjaesim.com",
  "telephone": "+13072262252",
  "email": "info@shqiponjaesim.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "2232 Dell Range Blvd, Suite 303 1440",
    "addressLocality": "Cheyenne",
    "addressRegion": "WY",
    "postalCode": "82009",
    "addressCountry": "US"
  },
  "brand": {
    "@type": "Brand",
    "name": "Shqiponja eSIM"
  }
}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('shqiponja-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <I18nProvider>
              <CurrencyProvider>
                <ToastProvider>
                  {children}
                  <AnalyticsBootstrap />
                  <LiveChatVisibility />
                </ToastProvider>
              </CurrencyProvider>
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(d,w,c){w.BrevoConversationsID='69c42990ed5ccd0b86050335';w[c]=w[c]||function(){(w[c].q=w[c].q||[]).push(arguments)};var s=d.createElement('script');s.async=true;s.src='https://conversations-widget.brevo.com/brevo-conversations.js';if(d.head)d.head.appendChild(s)})(document,window,'BrevoConversations');`,
          }}
        />
        <div
          id="cookie-banner"
          className="fixed bottom-0 w-full bg-gray-900 text-white p-4 z-50"
          style={{ display: "none" }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">Përdorim cookies për të përmirësuar shërbimin. Duke vazhduar, ju pranoni <a href="/cookies" className="underline">Cookie Policy</a>.</p>
            <div className="flex gap-2">
              <button onClick={() => {}} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm">Prano Të Gjitha</button>
              <button onClick={() => {}} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm">Refuzo Jo-Esencialet</button>
            </div>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if (!localStorage.getItem('cookieConsent')) {
  document.getElementById('cookie-banner').style.display = 'block';
}
function acceptCookies() {
  localStorage.setItem('cookieConsent', 'accepted');
  document.getElementById('cookie-banner').style.display = 'none';
}
function rejectCookies() {
  localStorage.setItem('cookieConsent', 'rejected');
  document.getElementById('cookie-banner').style.display = 'none';
}
(function(){
  var banner=document.getElementById('cookie-banner');
  if(!banner) return;
  var buttons=banner.querySelectorAll('button');
  if(buttons[0]) buttons[0].addEventListener('click', acceptCookies);
  if(buttons[1]) buttons[1].addEventListener('click', rejectCookies);
})();`,
          }}
        />
      </body>
    </html>
  );
}
