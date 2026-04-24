"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";

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

const scenes = [
  {
    id: "website",
    title: "1. Zgjidh & Bli",
    description: "Hap shqiponjaesim.com, zgjidh destinacionin dhe bli paketën tënde në sekonda.",
    icon: <GlobeIcon />,
    action: "Website Flow",
  },
  {
    id: "email",
    title: "2. Merr QR Kodin",
    description: "Kontrollo email-in. Do të pranosh menjëherë konfirmimin me QR kodin tënd unik.",
    icon: <MailIcon />,
    action: "Email Confirmation",
  },
  {
    id: "install",
    title: "3. Instalo eSIM",
    description: "Skano kodin nga cilësimet e telefonit tënd (Settings). Procesi zgjat vetëm 1 minutë.",
    icon: <QrCodeIcon />,
    action: "Scanning Process",
  },
  {
    id: "config",
    title: "4. Aktivizo Roaming",
    description: "E rëndësishme: Sigurohu që 'Data Roaming' të jetë ON për linjën e re 'Travel'.",
    icon: <RoamingIcon />,
    action: "Final Toggle",
  },
  {
    id: "ready",
    title: "5. Fluturo i Lirë",
    description: "Sapo të zbresësh, telefoni do të lidhet automatikisht me rrjetin lokal. Gati!",
    icon: (
      <div className="text-[#e8333a] scale-150">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    ),
    action: "Connected ✓",
  },
];

export default function InstallGuidePage() {
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
    <div className="min-h-screen bg-[#050508] text-white font-sans">
      <Navbar />

      <div className="flex items-center justify-center p-4 md:p-10 pt-24">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* KOLONA E MAJTË */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e8333a]/30 bg-[#e8333a]/10 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#e8333a] animate-pulse"></span>
                <span className="text-[10px] font-bold text-[#e8333a] uppercase tracking-widest">Udhëzuesi Interaktiv</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Instalimi në <br />
                <span className="text-[#e8333a]">5 hapa të thjeshtë.</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Ndiq këtë animacion për të parë se si të lidhesh me internetin kudo në botë pa humbur kohë.
              </p>
            </div>

            {/* Device Toggle */}
            <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit border border-white/10">
              <button
                onClick={() => setDevice("iphone")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${device === "iphone" ? "bg-[#e8333a] text-white shadow-lg" : "text-gray-500 hover:text-white"}`}
              >
                <IphoneIcon /> iPhone
              </button>
              <button
                onClick={() => setDevice("android")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${device === "android" ? "bg-[#e8333a] text-white shadow-lg" : "text-gray-500 hover:text-white"}`}
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
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${currentScene === idx ? "bg-white/10 border-[#e8333a]/50" : "bg-transparent border-transparent opacity-40 hover:opacity-100"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentScene === idx ? "bg-[#e8333a]" : "bg-white/10"}`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wider">{scene.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* KOLONA E DJATHTË: Telefoni */}
          <div className="lg:col-span-7 flex justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e8333a]/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative w-[320px] h-[650px] bg-[#000000] rounded-[60px] border-[8px] border-[#1c1c1e] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#1c1c1e] rounded-b-3xl z-50"></div>

              <div className="flex-grow flex flex-col p-8 pt-20 text-center items-center justify-center">
                <div className="absolute top-12 left-8 right-8 flex gap-1">
                  {scenes.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#e8333a] transition-all duration-100"
                        style={{ width: idx === currentScene ? `${progress}%` : idx < currentScene ? "100%" : "0%" }}
                      />
                    </div>
                  ))}
                </div>

                <div key={currentScene} className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                  <div className="w-24 h-24 mb-10 bg-white/5 rounded-[40px] flex items-center justify-center text-[#e8333a] border border-white/5 shadow-inner">
                    {scenes[currentScene].icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 tracking-tight">{scenes[currentScene].title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-10 px-4">
                    {device === "iphone" && currentScene === 2
                      ? "Shko te Settings > Cellular > Add eSIM."
                      : device === "android" && currentScene === 2
                      ? "Hap Settings > SIM Manager > Add eSIM."
                      : scenes[currentScene].description}
                  </p>
                  <div className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">{scenes[currentScene].action}</span>
                      <div className="w-2 h-2 rounded-full bg-[#e8333a] animate-pulse"></div>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#e8333a]/40" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-[#0a0a0f] border-t border-white/5 text-center">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Shqiponja eSIM Network</span>
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
    </div>
  );
}
