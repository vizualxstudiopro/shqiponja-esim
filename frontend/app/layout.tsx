import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shqiponja-esim.com"),
  title: {
    default: "Shqiponja eSIM — Lidhu me botën menjëherë",
    template: "%s | Shqiponja eSIM",
  },
  description:
    "Bli paketa eSIM ndërkombëtare nga operatorët më të mëdhenj. Interneti kudo pa roaming, pa SIM fizike.",
  alternates: {
    canonical: "https://shqiponja-esim.com",
  },
  openGraph: {
    type: "website",
    locale: "sq_AL",
    siteName: "Shqiponja eSIM",
    title: "Shqiponja eSIM — Lidhu me botën menjëherë",
    description: "Bli paketa eSIM ndërkombëtare. Interneti kudo pa roaming, pa SIM fizike.",
    url: "https://shqiponja-esim.com",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Shqiponja eSIM",
              url: "https://shqiponja-esim.com",
              logo: "https://shqiponja-esim.com/opengraph-image",
              description: "Platformë e-commerce për shitjen e paketave eSIM ndërkombëtare.",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                url: "https://shqiponja-esim.com/kontakti",
              },
              sameAs: [],
            }),
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
              <ToastProvider>{children}</ToastProvider>
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
