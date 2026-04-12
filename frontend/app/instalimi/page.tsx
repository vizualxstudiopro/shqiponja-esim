"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import Navbar from "@/components/navbar";

type Platform = "iphone" | "android";

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-shqiponja text-sm font-bold text-white">
      {n}
    </span>
  );
}

export default function InstallGuidePage() {
  const { t } = useI18n();
  const [platform, setPlatform] = useState<Platform>("iphone");

  const iphoneSteps = [
    { key: "install.iphone.step1" },
    { key: "install.iphone.step2" },
    { key: "install.iphone.step3" },
    { key: "install.iphone.step4" },
    { key: "install.iphone.step5" },
    { key: "install.iphone.step6" },
  ];

  const androidSteps = [
    { key: "install.android.step1" },
    { key: "install.android.step2" },
    { key: "install.android.step3" },
    { key: "install.android.step4" },
    { key: "install.android.step5" },
    { key: "install.android.step6" },
  ];

  const steps = platform === "iphone" ? iphoneSteps : androidSteps;

  const tips = [
    "install.tip1",
    "install.tip2",
    "install.tip3",
    "install.tip4",
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-shqiponja/10 px-4 py-1.5 text-xs font-semibold text-shqiponja">
            <PhoneIcon className="h-4 w-4" />
            {t("install.badge")}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("install.title")}
          </h1>
          <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
            {t("install.subtitle")}
          </p>
        </div>

        {/* Platform toggle */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-800">
            <button
              onClick={() => setPlatform("iphone")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                platform === "iphone"
                  ? "bg-shqiponja text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              🍎 iPhone
            </button>
            <button
              onClick={() => setPlatform("android")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                platform === "android"
                  ? "bg-shqiponja text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              🤖 Android
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-10 space-y-6">
          {steps.map((step, i) => (
            <div
              key={step.key}
              className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <StepNumber n={i + 1} />
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {t(step.key as Parameters<typeof t>[0])}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips section */}
        <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="text-lg font-bold">{t("install.tipsTitle")}</h2>
          <div className="mt-4 space-y-3">
            {tips.map((tip) => (
              <div key={tip} className="flex items-start gap-3">
                <CheckIcon />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t(tip as Parameters<typeof t>[0])}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/50 dark:bg-amber-900/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-amber-800 dark:text-amber-300">
            ⚠️ {t("install.troubleTitle")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-amber-700 dark:text-amber-400">
            <li>• {t("install.trouble1")}</li>
            <li>• {t("install.trouble2")}</li>
            <li>• {t("install.trouble3")}</li>
            <li>• {t("install.trouble4")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
