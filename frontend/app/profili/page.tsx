"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/lib/toast-context";
import { useRouter } from "next/navigation";
import { getMyOrders, updateProfile, changePassword, resendVerification, getMyReferral, type Order, type ReferralStats } from "@/lib/api";
import Link from "next/link";
import Navbar from "@/components/navbar";
import DigitalPassport from "@/components/digital-passport";

export default function ProfilePage() {
  const { user, token, loading: authLoading, setUser } = useAuth();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/hyr");
      return;
    }
    if (token) {
      getMyOrders(token)
        .then(setOrders)
        .finally(() => setLoading(false));
      getMyReferral(token)
        .then(setReferral)
        .catch(() => {});
    }
  }, [user, token, authLoading, router]);

  async function handleNameSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setSavingName(true);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string).trim();
    try {
      const updated = await updateProfile(token, name);
      setUser(updated);
      setEditingName(false);
      toast(t("profile.nameUpdated"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setSavingPw(true);
    const fd = new FormData(e.currentTarget);
    const currentPassword = fd.get("currentPassword") as string;
    const newPassword = fd.get("newPassword") as string;
    try {
      await changePassword(token, currentPassword, newPassword);
      setEditingPassword(false);
      toast(t("profile.passwordChanged"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setSavingPw(false);
    }
  }

  async function handleResendVerification() {
    if (!token || resending) return;
    setResending(true);
    try {
      await resendVerification(token);
      toast(t("profile.verificationSent"), "success");
    } catch {
      toast("Error", "error");
    } finally {
      setResending(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Profile card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-shqiponja/10 text-xl font-bold text-shqiponja">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-extrabold">{user.name}</h1>
              <p className="text-sm text-zinc-500">{user.email}</p>
              {user.email_verified ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  ✓ {t("profile.emailVerified")}
                </span>
              ) : (
                <span className="mt-1 inline-flex items-center gap-1.5">
                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    ⚠ {t("profile.emailNotVerified")}
                  </span>
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-xs font-medium text-shqiponja hover:underline disabled:opacity-50"
                  >
                    {t("profile.resendVerification")}
                  </button>
                </span>
              )}
            </div>
            <span className="ml-auto rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
              {user.role === "admin" ? "Admin" : t("profile.client")}
            </span>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            {t("profile.memberSince")}{" "}
            {new Date(user.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => setEditingName(true)} className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium hover:bg-zinc-50 transition dark:border-zinc-600 dark:hover:bg-zinc-700">
              {t("profile.editName")}
            </button>
            <button onClick={() => setEditingPassword(true)} className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium hover:bg-zinc-50 transition dark:border-zinc-600 dark:hover:bg-zinc-700">
              {t("profile.changePassword")}
            </button>
          </div>
        </div>

        {/* Referral Section */}
        {referral && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              🎁 {t("referral.title")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{t("referral.subtitle")}</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 font-mono text-sm font-semibold dark:border-zinc-600 dark:bg-zinc-700">
                {referral.referralCode}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referral.referralLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="rounded-lg bg-shqiponja px-4 py-2.5 text-sm font-semibold text-white hover:bg-shqiponja-dark transition"
              >
                {copied ? "✓ " + t("referral.copied") : t("referral.copyLink")}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-700/50">
                <p className="text-2xl font-extrabold text-shqiponja">{referral.stats.totalReferred}</p>
                <p className="mt-1 text-xs text-zinc-500">{t("referral.invited")}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-700/50">
                <p className="text-2xl font-extrabold text-green-600">{referral.stats.completedReferrals}</p>
                <p className="mt-1 text-xs text-zinc-500">{t("referral.completed")}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-700/50">
                <p className="text-2xl font-extrabold text-shqiponja">+{(referral.stats.totalRewardsGb ?? referral.stats.totalEarnings).toFixed(1)} GB</p>
                <p className="mt-1 text-xs text-zinc-500">Reward i fituar</p>
              </div>
            </div>
          </div>
        )}

        <DigitalPassport orders={orders} />

        {/* Edit Name Modal */}
        {editingName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingName(false)}>
            <form onSubmit={handleNameSave} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold">{t("profile.editName")}</h2>
              <input name="name" defaultValue={user.name} maxLength={100} className="mt-4 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingName(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition dark:border-zinc-600">
                  {t("admin.cancel")}
                </button>
                <button type="submit" disabled={savingName} className="rounded-lg bg-shqiponja px-4 py-2 text-sm font-semibold text-white hover:bg-shqiponja-dark transition disabled:opacity-50">
                  {t("profile.save")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Change Password Modal */}
        {editingPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingPassword(false)}>
            <form onSubmit={handlePasswordSave} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold">{t("profile.changePassword")}</h2>
              <input name="currentPassword" type="password" placeholder={t("profile.currentPassword")} className="mt-4 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <input name="newPassword" type="password" placeholder={t("profile.newPassword")} className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-600 dark:bg-zinc-700" />
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingPassword(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition dark:border-zinc-600">
                  {t("admin.cancel")}
                </button>
                <button type="submit" disabled={savingPw} className="rounded-lg bg-shqiponja px-4 py-2 text-sm font-semibold text-white hover:bg-shqiponja-dark transition disabled:opacity-50">
                  {t("profile.save")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Orders */}
        <h2 className="mt-10 text-lg font-extrabold">{t("profile.myOrders")}</h2>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-200" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-zinc-400">{t("profile.noOrders")}</p>
            <Link
              href="/#packages"
              className="mt-4 inline-block rounded-full bg-shqiponja px-6 py-2.5 text-sm font-semibold text-white hover:bg-shqiponja-dark transition"
            >
              {t("profile.viewPackages")}
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/porosi/${o.id}`}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span className="text-3xl">{o.package_flag}</span>
                <div className="flex-1">
                  <p className="font-bold">{o.package_name}</p>
                  <p className="text-xs text-zinc-500">
                    {t("profile.order")} #{o.id} ·{" "}
                    {new Date(o.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      o.payment_status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {o.payment_status === "paid" ? t("profile.paid") : t("profile.pending")}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      o.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {o.status === "completed" ? t("profile.completed") : t("profile.pending")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
