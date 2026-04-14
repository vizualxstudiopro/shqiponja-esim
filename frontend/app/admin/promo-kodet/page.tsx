"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/lib/toast-context";
import {
  adminGetPromoCodes,
  adminCreatePromoCode,
  adminUpdatePromoCode,
  adminDeletePromoCode,
  type PromoCode,
} from "@/lib/api";
import { Plus, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";

export default function AdminPromoPage() {
  const { token } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [form, setForm] = useState({ code: "", discount_type: "percent", discount_value: "", max_uses: "", min_order: "", expires_at: "" });
  const [creating, setCreating] = useState(false);

  const fetchCodes = useCallback(() => {
    if (!token) return;
    setLoading(true);
    adminGetPromoCodes(token).then(setCodes).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      const newCode = await adminCreatePromoCode(token, {
        code: form.code,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        min_order: form.min_order ? parseFloat(form.min_order) : 0,
        expires_at: form.expires_at || null,
      });
      setCodes((prev) => [newCode, ...prev]);
      setForm({ code: "", discount_type: "percent", discount_value: "", max_uses: "", min_order: "", expires_at: "" });
      setShowCreate(false);
      toast(t("admin.promo.created"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gabim", "error");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(p: PromoCode) {
    if (!token) return;
    try {
      const updated = await adminUpdatePromoCode(token, p.id, { active: !p.active });
      setCodes((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gabim", "error");
    }
  }

  async function handleDelete(id: number) {
    if (!token || !confirm(t("admin.promo.confirmDelete"))) return;
    try {
      await adminDeletePromoCode(token, id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
      toast(t("admin.promo.deleted"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gabim", "error");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.promo.title")}</h1>
          <p className="text-sm text-zinc-500">{t("admin.promo.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-shqiponja px-4 py-2 text-sm font-medium text-white transition hover:bg-shqiponja-dark"
        >
          <Plus className="h-4 w-4" /> {t("admin.promo.add")}
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("admin.promo.add")}</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">{t("admin.promo.code")}</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SHQIPONJA20"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">{t("admin.promo.type")}</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="percent">% {t("admin.promo.percent")}</option>
                    <option value="fixed">€ {t("admin.promo.fixed")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">{t("admin.promo.value")}</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">{t("admin.promo.maxUses")}</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="∞"
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t("admin.promo.minOrder")}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order}
                    onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">{t("admin.promo.expires")}</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-lg bg-shqiponja px-4 py-2.5 text-sm font-medium text-white transition hover:bg-shqiponja-dark disabled:opacity-50"
              >
                {creating ? "..." : t("admin.promo.create")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                <th className="px-4 py-3">{t("admin.promo.code")}</th>
                <th className="px-4 py-3">{t("admin.promo.discount")}</th>
                <th className="px-4 py-3">{t("admin.promo.usage")}</th>
                <th className="px-4 py-3">{t("admin.promo.expires")}</th>
                <th className="px-4 py-3">{t("admin.promo.status")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">...</td></tr>
              ) : codes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">{t("admin.promo.empty")}</td></tr>
              ) : codes.map((p) => (
                <tr key={p.id} className="border-b border-zinc-50 transition hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-mono font-bold">{p.code}</td>
                  <td className="px-4 py-3">
                    {p.discount_type === "percent" ? `${p.discount_value}%` : `€${p.discount_value.toFixed(2)}`}
                    {p.min_order > 0 && <span className="ml-1 text-xs text-zinc-400">(min €{p.min_order})</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{p.used_count}</span>
                    <span className="text-zinc-400">/{p.max_uses ?? "∞"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)} title={p.active ? "Aktiv" : "Joaktiv"}>
                      {p.active ? (
                        <ToggleRight className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-zinc-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(p.id)} className="text-zinc-400 transition hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
