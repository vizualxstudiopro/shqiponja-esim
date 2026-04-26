"use client";

import { useState } from "react";
import Link from "next/link";

function openBrevoChat() {
  if (typeof window === "undefined") return false;
  const convo = (window as unknown as Record<string, unknown>).BrevoConversations;
  if (typeof convo !== "function") return false;

  const api = convo as (...args: unknown[]) => void;
  try {
    // Different widget versions expose different commands.
    api("open");
    api("show");
    api("openChat");
    return true;
  } catch {
    return false;
  }
}

export default function LiveChatAssistant() {
  const [opened, setOpened] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-[60] sm:right-6">
      <div className="max-w-[280px] rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-shqiponja/10 text-xl">🧔</div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-shqiponja">Agroni • Live Support</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Ke pyetje? Hape live chat-in ose na shkruaj direkt.</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setOpened(openBrevoChat())}
                className="rounded-lg bg-shqiponja px-3 py-1.5 text-xs font-semibold text-white hover:bg-shqiponja-dark"
              >
                Hap Chat
              </button>
              <Link
                href="/kontakti"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Kontakt
              </Link>
            </div>
            {!opened && <p className="mt-1 text-[10px] text-zinc-400">Nese nuk hapet automatikisht, perdor butonin e chat-it poshte djathtas.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
