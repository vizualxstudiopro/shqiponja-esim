"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { useI18n } from "@/lib/i18n-context";

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IphoneIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 10l-1.5-3M7 10L8.5 7M6 14v4M18 14v4M12 18v2M12 7a5 5 0 0 1 5 5v3H7v-3a5 5 0 0 1 5-5z" />
  </svg>
);

const QrCodeIcon = () => (
  <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <path d="M7 14h.01M17 14h.01M7 7h.01M17 7h.01" strokeWidth="3" />
  </svg>
);

const RoamingIcon = () => (
  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.59 16.11a6 6 0 0 1 6.82 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const buildScenes = (isEnglish: boolean) => [
  {
    id: "website",
    title: isEnglish ? "1. Choose & Buy" : "1. Zgjidh & Bli",
    description: isEnglish
      ? "Open shqiponjaesim.com, pick your destination, and buy your package in seconds."
      : "Hap shqiponjaesim.com, zgjidh destinacionin dhe bli paketën tënde në sekonda.",
    icon: <GlobeIcon />,
    action: "Website Flow",
  },
  {
    id: "email",
    title: isEnglish ? "2. Get QR Code" : "2. Merr QR Kodin",
    description: isEnglish
      ? "Check your email. You will instantly receive confirmation with your unique QR code."
      : "Kontrollo email-in. Do të pranosh menjëherë konfirmimin me QR kodin tënd unik.",
    icon: <MailIcon />,
    action: isEnglish ? "Email Confirmation" : "Konfirmimi me Email",
  },
  {
    id: "install",
    title: isEnglish ? "3. Install eSIM" : "3. Instalo eSIM",
    description: isEnglish
      ? "Scan the code from your phone settings. The process takes around 1 minute."
      : "Skano kodin nga cilësimet e telefonit tënd (Settings). Procesi zgjat vetëm 1 minutë.",
    icon: <QrCodeIcon />,
    action: isEnglish ? "Scanning Process" : "Procesi i Skanimit",
  },
  {
    id: "config",
    title: isEnglish ? "4. Enable Roaming" : "4. Aktivizo Roaming",
    description: isEnglish
      ? "Important: make sure Data Roaming is ON for your new Travel line."
      : "E rëndësishme: Sigurohu që 'Data Roaming' të jetë ON për linjën e re 'Travel'.",
    icon: <RoamingIcon />,
    action: isEnglish ? "Final Toggle" : "Aktivizimi Final",
  },
  {
    id: "ready",
    title: isEnglish ? "5. You Are Ready" : "5. Fluturo i Lirë",
    description: isEnglish
      ? "As soon as you land, your phone will connect automatically to the local network. Done!"
      : "Sapo të zbresësh, telefoni do të lidhet automatikisht me rrjetin lokal. Gati!",
    icon: (
      <div className="text-shqiponja scale-150">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    ),
    action: isEnglish ? "Connected" : "Lidhur",
  },
];

export default function InstallGuidePage() {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const scenes = buildScenes(isEnglish);
  const [currentScene, setCurrentScene] = useState(0);
  const [device, setDevice] = useState<"iphone" | "android">("iphone");
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setCurrentScene((prev) => (prev + 1) % scenes.length);
          return 0;
        }
        return p + 0.8;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleManualNav = (index: number) => {
    setCurrentScene(index);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      <Navbar />

      <div className="flex items-center justify-center p-4 md:p-10 pt-24">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* KOLONA E MAJTË */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-shqiponja/30 bg-shqiponja/10 mb-6">
                <span className="w-2 h-2 rounded-full bg-shqiponja animate-pulse"></span>
                <span className="text-[10px] font-bold text-shqiponja uppercase tracking-widest">{isEnglish ? "Interactive Guide" : "Udhëzuesi Interaktiv"}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                {isEnglish ? "Installation in" : "Instalimi në"} <br />
                <span className="text-shqiponja">{isEnglish ? "5 simple steps." : "5 hapa të thjeshtë."}</span>
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                {isEnglish
                  ? "Follow this animation to see how to connect to the internet anywhere in the world without wasting time."
                  : "Ndiq këtë animacion për të parë se si të lidhesh me internetin kudo në botë pa humbur kohë."}
              </p>
            </div>

            {/* Device Toggle */}
            <div className="flex gap-4 p-1 bg-white rounded-2xl w-fit border border-zinc-200 shadow-sm dark:bg-zinc-900/70 dark:border-zinc-800">
              <button
                onClick={() => setDevice("iphone")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${device === "iphone" ? "bg-shqiponja text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
              >
                <IphoneIcon /> iPhone
              </button>
              <button
                onClick={() => setDevice("android")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${device === "android" ? "bg-shqiponja text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
              >
                <AndroidIcon /> Android
              </button>
            </div>

            {/* Stepper Navigation */}
            <div className="space-y-4">
              {scenes.map((scene, idx) => (
                <button
                  key={idx}
                  onClick={() => handleManualNav(idx)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${currentScene === idx ? "bg-white border-shqiponja/40 shadow-sm dark:bg-zinc-900/80" : "bg-transparent border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentScene === idx ? "bg-shqiponja text-white" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wider">{scene.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* KOLONA E DJATHTË: Telefoni */}
          <div className="lg:col-span-7 flex justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-shqiponja/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="phone-tilt relative">
              <div className="relative w-[320px] h-[650px] bg-[#000000] rounded-[60px] border-[8px] border-[#1c1c1e] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#1c1c1e] rounded-b-3xl z-50"></div>

                <div className="flex-grow flex flex-col px-5 pt-14 pb-5 relative">
                  <div className="rounded-2xl bg-[#101115] border border-white/10 px-3 py-2 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">Shqiponja eSIM</p>
                        <p className="text-xs font-semibold text-zinc-100">{isEnglish ? "Installation" : "Instalimi"}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        <span className="text-[10px] text-zinc-400">Online</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded-full bg-shqiponja/20 px-2 py-1 text-[9px] font-semibold text-shqiponja">{isEnglish ? "Packages" : "Paketa"}</span>
                      <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-semibold text-zinc-400">{isEnglish ? "Install" : "Instalimi"}</span>
                      <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-semibold text-zinc-400">{isEnglish ? "Profile" : "Profili"}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#121317] border border-white/10 p-3 mb-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{isEnglish ? "Destination" : "Destinacioni"}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-100">{isEnglish ? "Europe 10GB / 30 days" : "Europe 10GB / 30 ditë"}</p>
                      <span className="text-sm font-bold text-shqiponja">€24.90</span>
                    </div>
                  </div>

                  <div className="absolute top-[122px] left-5 right-5 flex gap-1 z-20">
                  {scenes.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-shqiponja transition-all duration-100"
                        style={{ width: idx === currentScene ? `${progress}%` : idx < currentScene ? "100%" : "0%" }}
                      />
                    </div>
                  ))}
                </div>

                  <div key={currentScene} className="animate-in fade-in zoom-in duration-500 flex flex-col items-center text-center mt-12">
                    <div className="w-20 h-20 mb-5 bg-white/5 rounded-[28px] flex items-center justify-center text-shqiponja border border-white/5 shadow-inner">
                      {scenes[currentScene].icon}
                    </div>
                    <h3 className="text-base font-bold mb-2 tracking-tight text-zinc-100">{scenes[currentScene].title}</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mb-5 px-2">
                      {device === "iphone" && currentScene === 2
                        ? isEnglish
                          ? "Go to Settings > Cellular > Add eSIM."
                          : "Shko te Settings > Cellular > Add eSIM."
                        : device === "android" && currentScene === 2
                        ? isEnglish
                          ? "Open Settings > SIM Manager > Add eSIM."
                          : "Hap Settings > SIM Manager > Add eSIM."
                        : scenes[currentScene].description}
                    </p>
                    <div className="w-full bg-[#121212] border border-white/5 rounded-2xl p-3 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">{scenes[currentScene].action}</span>
                        <div className="w-2 h-2 rounded-full bg-shqiponja animate-pulse"></div>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-shqiponja/40" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto rounded-2xl bg-[#121317] border border-white/10 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{isEnglish ? "Your order" : "Porosia jote"}</p>
                      <span className="text-[10px] font-semibold text-emerald-400">{isEnglish ? "Active" : "Aktive"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-zinc-400">Data</span>
                      <span className="text-zinc-200 font-medium">7.5GB / 10GB</span>
                    </div>
                    <button className="w-full rounded-xl bg-shqiponja text-white text-xs font-semibold py-2">
                      {isEnglish ? "View QR and Instructions" : "Shiko QR dhe Udhëzimet"}
                    </button>
                  </div>
                </div>

                {/* Efekt xhami mbi ekran */}
                <div className="glass-overlay pointer-events-none absolute inset-[8px] rounded-[52px] overflow-hidden z-40">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"></div>
                  <div className="absolute -left-20 top-16 h-56 w-32 rotate-12 bg-white/8 blur-xl"></div>
                  <div className="glass-shimmer absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
                  <div className="absolute inset-0 border border-white/8 rounded-[52px]"></div>
                </div>
                <div className="p-5 bg-[#0a0a0f] border-t border-white/5 text-center">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Shqiponja eSIM Network</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="absolute bottom-4 right-4 bg-white text-black p-4 rounded-full shadow-xl hover:scale-110 transition-transform z-50"
            >
              {isPaused ? (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              ) : (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              )}
            </button>
          </div>

        </div>
      </div>

      <style jsx>{`
        .glass-overlay {
          will-change: transform;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          perspective: 1000px;
        }

        .phone-tilt {
          transform-style: preserve-3d;
          transform: perspective(1300px) rotateY(-14deg) rotateX(5deg);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }

        @media (max-width: 1024px) {
          .phone-tilt {
            transform: perspective(1000px) rotateY(-8deg) rotateX(3deg);
          }
        }

        @media (max-width: 768px) {
          .phone-tilt {
            transform: none;
          }
        }

        .glass-shimmer {
          animation: glassShimmer 6s ease-in-out infinite;
          will-change: transform;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transform: translate3d(0, 0, 0);
        }

        @keyframes glassShimmer {
          0% {
            transform: translate3d(-140%, 0, 0);
            opacity: 0;
          }
          18% {
            opacity: 0.45;
          }
          42% {
            opacity: 0.2;
          }
          55% {
            transform: translate3d(400%, 0, 0);
            opacity: 0;
          }
          100% {
            transform: translate3d(400%, 0, 0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
