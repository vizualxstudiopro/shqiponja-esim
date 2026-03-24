"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { twoFactorSetup, twoFactorVerifySetup, twoFactorDisable, twoFactorStatus } from "@/lib/api";

export default function AdminSecurityPage() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      twoFactorStatus(token).then((s) => setEnabled(s.enabled)).catch(() => {});
    }
  }, [token]);

  async function handleSetup() {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const data = await twoFactorSetup(token);
      setSetupData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Setup dështoi");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySetup() {
    if (!token || !code) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await twoFactorVerifySetup(token, code);
      setMessage(res.message);
      setEnabled(true);
      setSetupData(null);
      setCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verifikimi dështoi");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!token || !code) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await twoFactorDisable(token, code);
      setMessage(res.message);
      setEnabled(false);
      setCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Çaktivizimi dështoi");
    } finally {
      setLoading(false);
    }
  }

  if (enabled === null) {
    return <div className="animate-pulse h-24 rounded-xl bg-zinc-200" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold">{t("admin.security")}</h1>
      <p className="mt-1 text-sm text-zinc-500">{t("admin.securityDesc")}</p>

      <div className="mt-8 max-w-lg rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-bold">{t("admin.twoFactor")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("admin.twoFactorDesc")}</p>

        <div className="mt-4 flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${enabled ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>
            {enabled ? t("admin.twoFactorOn") : t("admin.twoFactorOff")}
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-100">
            {message}
          </div>
        )}

        {!enabled && !setupData && (
          <button
            onClick={handleSetup}
            disabled={loading}
            className="mt-6 rounded-lg bg-shqiponja px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-shqiponja-dark disabled:opacity-50"
          >
            {t("admin.enable2FA")}
          </button>
        )}

        {setupData && (
          <div className="mt-6 space-y-4">
            <p className="text-sm font-medium">{t("admin.scanQR")}</p>
            <div className="flex justify-center rounded-lg bg-white p-4">
              <img src={setupData.qrCode} alt="QR Code" className="h-48 w-48" />
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <p className="text-xs text-zinc-500">{t("admin.manualKey")}</p>
              <p className="mt-1 font-mono text-sm select-all break-all">{setupData.secret}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("admin.enterCode")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-lg font-mono tracking-[0.3em] outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <button
              onClick={handleVerifySetup}
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-shqiponja py-2.5 text-sm font-semibold text-white shadow transition hover:bg-shqiponja-dark disabled:opacity-50"
            >
              {t("admin.verify2FA")}
            </button>
          </div>
        )}

        {enabled && (
          <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("admin.disable2FATitle")}</p>
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-lg font-mono tracking-[0.3em] outline-none transition focus:border-shqiponja focus:ring-2 focus:ring-shqiponja/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <button
              onClick={handleDisable}
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
            >
              {t("admin.disable2FA")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
