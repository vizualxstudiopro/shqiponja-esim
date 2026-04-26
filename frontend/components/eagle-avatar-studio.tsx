"use client";

import { useEffect, useState } from "react";
import { EAGLE_TEAM } from "@/lib/eagle-team";
import { getAvatarTeam } from "@/lib/api";

interface AvatarCardProps {
  name: string;
  role: string;
  useCase: string;
  imageUrl: string | null;
  isActive: boolean;
  onClick: () => void;
}

function AvatarCard({ name, role, useCase, imageUrl, isActive, onClick }: AvatarCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 ${
        isActive
          ? "scale-105 border-[#e8333a] shadow-[0_0_40px_rgba(232,51,58,0.3)]"
          : "border-white/5 grayscale hover:grayscale-0"
      }`}
    >
      <div className="relative aspect-[3/4] bg-[#1a1a1a]">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full animate-in object-cover fade-in duration-700" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#111] p-6 text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#e8333a] border-t-transparent" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Duke u gjeneruar...</p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
          <h3 className="mb-1 text-xl font-bold text-white">{name}</h3>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#e8333a]">{role}</p>
          <p className="text-[9px] italic uppercase text-gray-400 opacity-70">{useCase}</p>
        </div>
      </div>
    </div>
  );
}

function getFallbackImage(name: string): string {
  const letter = name.charAt(0).toUpperCase();
  const svg = `<svg width="400" height="533" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1a1a1a"/><circle cx="200" cy="266" r="100" fill="#e8333a" opacity="0.05"/><text x="50%" y="50%" font-family="Georgia, serif" font-size="140" font-weight="bold" fill="#e8333a" text-anchor="middle" dominant-baseline="central">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function EagleAvatarStudio() {
  const [selectedId, setSelectedId] = useState(1);
  const [images, setImages] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function hydrateImages() {
      const remote = await getAvatarTeam();
      if (!cancelled && remote.length) {
        setImages((prev) => {
          const next = { ...prev };
          for (const avatar of EAGLE_TEAM) {
            const match = remote.find((item) => item.name.toLowerCase() === avatar.name.toLowerCase());
            if (match?.imageData) next[avatar.id] = match.imageData;
          }
          return next;
        });
      }

      for (const avatar of EAGLE_TEAM) {
        if (cancelled) return;
        await new Promise((resolve) => setTimeout(resolve, 120));
        setImages((prev) => {
          if (prev[avatar.id]) return prev;
          return { ...prev, [avatar.id]: getFallbackImage(avatar.name) };
        });
      }
    }

    hydrateImages();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAvatar = EAGLE_TEAM.find((avatar) => avatar.id === selectedId);

  return (
    <div className="min-h-screen bg-[#050508] p-6 text-white md:p-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-16 flex flex-col items-start justify-between gap-8 border-b border-white/5 pb-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e8333a]/30 bg-[#e8333a]/10 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#e8333a]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#e8333a]">Ekipi Digjital</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold italic md:text-6xl">
              Karakteret e
              <br />
              <span className="text-[#e8333a]">Memedheut</span>
            </h1>
            <p className="text-lg text-gray-400">
              Nje skuader e unifikuar personazhesh 3D qe shoqerojne klientin ne cdo hap te eksperiences eSIM.
            </p>
          </div>

          {selectedAvatar && (
            <div className="hidden rounded-3xl border border-white/10 bg-[#111111] p-6 md:block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Roli:</span>
              <span className="text-lg text-white">{selectedAvatar.useCase}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EAGLE_TEAM.map((avatar) => (
            <AvatarCard
              key={avatar.id}
              name={avatar.name}
              role={avatar.role}
              useCase={avatar.useCase}
              imageUrl={images[avatar.id] ?? null}
              isActive={selectedId === avatar.id}
              onClick={() => setSelectedId(avatar.id)}
            />
          ))}
        </div>

        <div className="mt-20">
          <h2 className="mb-8 text-2xl font-bold">Skenaret e Perdorimit</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/5 bg-[#111111] p-8 transition-all hover:border-[#e8333a]/40">
              <div className="mb-4 flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-black">
                  {images[2] ? (
                    <img src={images[2]} alt="Bato" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[8px] text-gray-600 animate-pulse">3D</div>
                  )}
                </div>
                <h4 className="font-bold">Bato</h4>
              </div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Roli: Harruat Fjalekalimin?</p>
              <p className="text-sm italic leading-relaxed text-gray-400">
                "Mos u shqeteso, Besmir. Ndiqi udhezimet ne email per te krijuar nje fjalekalim te ri dhe te sigurt."
              </p>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111111] p-8 transition-all hover:border-[#e8333a]/40">
              <div className="mb-4 flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-black">
                  {images[3] ? (
                    <img src={images[3]} alt="Glauku" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[8px] text-gray-600 animate-pulse">3D</div>
                  )}
                </div>
                <h4 className="font-bold">Glauku</h4>
              </div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Roli: Blerja e Paketave</p>
              <p className="text-sm italic leading-relaxed text-gray-400">
                "Zgjidh paketen Memedheu dhe une do te te ndihmoj ta aktivizosh ne pak sekonda. Udha e mbare!"
              </p>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111111] p-8 transition-all hover:border-[#e8333a]/40">
              <div className="mb-4 flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-black">
                  {images[5] ? (
                    <img src={images[5]} alt="Enkela" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[8px] text-gray-600 animate-pulse">3D</div>
                  )}
                </div>
                <h4 className="font-bold">Enkela</h4>
              </div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Roli: Mireseardhja</p>
              <p className="text-sm italic leading-relaxed text-gray-400">
                "Miresevjen ne familjen tone! Jam ketu per te te shoqeruar ne cdo hap te regjistrimit tend te pare."
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-20 text-center text-[10px] font-bold uppercase tracking-[0.5em] text-gray-600">
          © 2026 Shqiponja eSIM Network • VizualX Studio
        </footer>
      </div>
    </div>
  );
}
