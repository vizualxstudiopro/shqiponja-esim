"use client";

import { useEffect, useMemo, useState } from "react";
import { getEagleAvatarById } from "@/lib/eagle-team";
import { checkDeviceCompatibility, getMyReferral, type CompatibilityCheckResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type TabKey = "passport" | "besa" | "check";

interface Stamp {
  country: string;
  date: string;
  icon: string;
  isUnlocked: boolean;
}

interface PassportStampProps extends Stamp {}

function PassportStamp({ country, date, icon, isUnlocked }: PassportStampProps) {
  return (
    <div
      className={`relative h-24 w-24 rounded-full border-2 border-dashed transition-all duration-700 flex items-center justify-center ${
        isUnlocked
          ? "border-[#D4AF37] bg-[#D4AF37]/10 rotate-12 scale-110"
          : "border-white/10 grayscale opacity-20"
      }`}
    >
      <div className="text-center">
        <div className="mb-1 text-2xl">{icon}</div>
        <div className="text-[8px] font-black uppercase tracking-tighter text-white">{country}</div>
        {isUnlocked && <div className="mt-1 text-[6px] text-[#D4AF37]">{date}</div>}
      </div>
      {isUnlocked && (
        <div className="absolute -right-1 -top-1 rounded-full bg-[#e8333a] px-1.5 py-0.5 text-[8px] font-bold text-white">
          ✓
        </div>
      )}
    </div>
  );
}

function AvatarCard({ label, accent }: { label: string; accent: string }) {
  return (
    <div className="relative mx-auto mb-8 h-40 w-40 overflow-hidden rounded-full border-4 border-white/10 bg-black/40">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${accent}, transparent 55%)`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function EagleExperienceDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("passport");
  const [phoneModel, setPhoneModel] = useState("");
  const [result, setResult] = useState<CompatibilityCheckResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [referralCode, setReferralCode] = useState("BESA-2026");
  const enkela = getEagleAvatarById(5);
  const bato = getEagleAvatarById(2);

  useEffect(() => {
    if (!token) return;
    getMyReferral(token)
      .then((data) => {
        if (data?.referralCode) setReferralCode(data.referralCode);
      })
      .catch(() => {});
  }, [token]);

  const stamps = useMemo<Stamp[]>(
    () => [
      { country: "Shqiperi", date: "12/04/2026", icon: "🦅", isUnlocked: true },
      { country: "Gjermani", date: "15/04/2026", icon: "🥨", isUnlocked: true },
      { country: "SHBA", date: "--", icon: "🗽", isUnlocked: false },
      { country: "Turqi", date: "--", icon: "🕌", isUnlocked: false },
      { country: "Itali", date: "--", icon: "🏛️", isUnlocked: false },
      { country: "Kosove", date: "--", icon: "🇽🇰", isUnlocked: false },
      { country: "Zvicer", date: "--", icon: "🏔️", isUnlocked: false },
    ],
    []
  );

  async function checkCompatibility() {
    if (!phoneModel.trim()) {
      setResult({ compatible: false, query: "", confidence: 0, matches: [] });
      return;
    }
    setChecking(true);
    const response = await checkDeviceCompatibility(phoneModel);
    setResult(response);
    setChecking(false);
  }

  return (
    <div className="min-h-screen bg-[#050508] p-4 text-white md:p-12">
      <div className="mx-auto max-w-6xl">
        <nav className="mx-auto mb-12 flex w-fit flex-wrap gap-4 rounded-2xl border border-white/5 bg-[#111111] p-2 lg:mx-0">
          <button
            onClick={() => setActiveTab("passport")}
            className={`rounded-xl px-6 py-3 text-sm font-bold transition-all ${
              activeTab === "passport" ? "bg-[#e8333a] text-white" : "text-gray-500 hover:text-white"
            }`}
          >
            Pasaporta Digjitale
          </button>
          <button
            onClick={() => setActiveTab("besa")}
            className={`rounded-xl px-6 py-3 text-sm font-bold transition-all ${
              activeTab === "besa" ? "bg-[#e8333a] text-white" : "text-gray-500 hover:text-white"
            }`}
          >
            Besa (Referimi)
          </button>
          <button
            onClick={() => setActiveTab("check")}
            className={`rounded-xl px-6 py-3 text-sm font-bold transition-all ${
              activeTab === "check" ? "bg-[#e8333a] text-white" : "text-gray-500 hover:text-white"
            }`}
          >
            Kontrolli i Pajisjes
          </button>
        </nav>

        {activeTab === "passport" && (
          <div className="grid grid-cols-1 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 lg:grid-cols-12">
            <div className="rounded-[3rem] border border-[#e8333a]/20 bg-gradient-to-br from-[#1a0608] to-[#111111] p-10 lg:col-span-4">
              <AvatarCard label={enkela?.name ?? "Enkela"} accent="#e8333a" />
              <h2 className="mb-4 text-center text-2xl font-bold">Miresevjen, Besmir!</h2>
              <p className="mb-8 text-center text-sm italic text-gray-400">
                "Pasaporta jote po mbushet. Fluturo ne sa me shume shtete per te fituar statusin 'Shqiponja e Arte'."
              </p>
              <div className="rounded-2xl bg-black/20 p-4 text-center">
                <div className="mb-1 text-xs uppercase text-gray-500">Statusi Aktual</div>
                <div className="text-xl font-black tracking-widest text-[#D4AF37]">UDHETAR I LIRE</div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <h3 className="mb-8 text-3xl font-bold">Vulat e Mia</h3>
              <div className="grid grid-cols-3 gap-8 sm:grid-cols-4 md:grid-cols-5">
                {stamps.map((stamp) => (
                  <PassportStamp key={stamp.country} {...stamp} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "besa" && (
          <div className="mx-auto max-w-4xl animate-in zoom-in text-center duration-700">
            <div className="mb-10 inline-block rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-6">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="mb-6 text-4xl font-bold tracking-tight">Besa e Shqiponjes</h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-gray-400">
              Shperndaje pervojen tende me miqte. Kur ata blejne eSIM-in e tyre te pare me kodin tend,
              ju te dy fitoni <span className="font-bold text-white">3GB Internet Falas</span>.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <div className="rounded-2xl border border-white/10 bg-[#111111] px-8 py-4 font-mono text-xl font-black tracking-[0.5em] text-[#e8333a]">
                {referralCode}
              </div>
              <button className="rounded-2xl bg-white px-8 py-4 font-bold text-black transition-all hover:bg-[#e8333a] hover:text-white">
                Kopjo Kodin
              </button>
            </div>
          </div>
        )}

        {activeTab === "check" && (
          <div className="grid grid-cols-1 items-center gap-12 animate-in fade-in slide-in-from-right-4 duration-700 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="group relative">
                <div className="absolute inset-0 bg-[#e8333a] opacity-10 blur-[60px] transition-opacity group-hover:opacity-20" />
                <div className="relative aspect-square w-full overflow-hidden rounded-[3rem] border border-white/10 bg-[#111111]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,#e8333a33,transparent_55%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full border border-white/20 bg-black/40 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
                      {bato?.name ?? "Bato"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-8 lg:col-span-7">
              <h2 className="text-4xl font-bold leading-tight">
                {`Pershendetje! Une jam ${bato?.name ?? "Bato"}.`}
                <br />
                <span className="text-[#e8333a]">A punon telefoni yt?</span>
              </h2>
              <p className="text-lg text-gray-400">
                Jo te gjithe telefonat e pranojne teknologjine eSIM. Shkruaj modelin e telefonit tend me poshte dhe do ta kontrolloj ne cast.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={phoneModel}
                    onChange={(e) => setPhoneModel(e.target.value)}
                    placeholder="Psh: iPhone 15 Pro, Samsung S23..."
                    className="flex-grow rounded-2xl border border-white/10 bg-[#111111] p-5 outline-none transition-all focus:border-[#e8333a]"
                  />
                  <button
                    onClick={checkCompatibility}
                    disabled={checking}
                    className="rounded-2xl bg-[#e8333a] px-8 py-5 font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    {checking ? "Duke kontrolluar..." : "Kontrollo"}
                  </button>
                </div>

                {result !== null && (
                  <div
                    className={`animate-in rounded-2xl border p-6 slide-in-from-top-2 ${
                      result.compatible ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"
                    }`}
                  >
                    {result.compatible ? (
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">✅</span>
                        <p className="text-sm font-bold uppercase tracking-wide text-green-400">
                          Pajisja duket e pajtueshme me Shqiponja eSIM.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">⚠️</span>
                        <p className="text-sm font-bold uppercase tracking-wide text-red-400">
                          Ky model nuk u gjet ne listen tone. Na shkruani ne suport per verifikim.
                        </p>
                      </div>
                    )}
                    {result.matches.length > 0 && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
                          Modele te ngjashme ({result.confidence}% confidence)
                        </p>
                        <ul className="space-y-1 text-xs text-zinc-300">
                          {result.matches.slice(0, 3).map((match) => (
                            <li key={`${match.brand}-${match.model}`}>{match.brand} {match.model}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-24 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 opacity-40 md:flex-row">
        <div className="text-[10px] font-bold uppercase tracking-[0.4em]">Dashboard v2.1 • Shqiponja eSIM</div>
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-[#e8333a]">
            Kushtet
          </a>
          <a href="#" className="hover:text-[#e8333a]">
            Privatesia
          </a>
          <a href="#" className="hover:text-[#e8333a]">
            Klubi VIP
          </a>
        </div>
      </div>
    </div>
  );
}
