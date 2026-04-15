import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  adminGetPromoCodes,
  adminCreatePromoCode,
  adminUpdatePromoCode,
  adminDeletePromoCode,
  type PromoCode,
} from "@/lib/api";
import { Plus, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";

export default function PromoCodes() {
  const { token } = useAuth();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: "", discount_type: "percent", discount_value: "", max_uses: "", min_order: "", expires_at: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchCodes = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    adminGetPromoCodes(token).then(setCodes).catch((err) => setError(err.message)).finally(() => setLoading(false));
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
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Krijimi dështoi");
    }
    setCreating(false);
  }

  async function toggleActive(p: PromoCode) {
    if (!token) return;
    try {
      const updated = await adminUpdatePromoCode(token, p.id, { active: !p.active });
      setCodes((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ndryshimi dështoi");
    }
  }

  async function handleDelete(id: number) {
    if (!token || !confirm("Je i sigurt që dëshiron ta fshish këtë kod?")) return;
    try {
      await adminDeletePromoCode(token, id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fshirja dështoi");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Promo Kodet</h1>
          <p className="text-sm text-zinc-500">Menaxho kodet e zbritjes dhe ofertat</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-shqiponja px-4 py-2 text-sm font-medium text-white transition hover:bg-shqiponja/90"
        >
          <Plus className="h-4 w-4" /> Shto Kod
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-200"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-100">Shto Kod të Ri</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Kodi</label>
                <input
                  type="text" required value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SHQIPONJA20"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-shqiponja focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Lloji</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-shqiponja focus:outline-none"
                  >
                    <option value="percent">% Përqindje</option>
                    <option value="fixed">€ Vlerë Fikse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Vlera</label>
                  <input
                    type="number" required min="0.01" step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-shqiponja focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Përdorime Max</label>
                  <input
                    type="number" min="1"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="∞"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-shqiponja focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Porosi Min (€)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.min_order}
                    onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-shqiponja focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300">Skadon</label>
                <input
                  type="date" value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-shqiponja focus:outline-none"
                />
              </div>
              <button
                type="submit" disabled={creating}
                className="w-full rounded-lg bg-shqiponja px-4 py-2.5 text-sm font-medium text-white transition hover:bg-shqiponja/90 disabled:opacity-50"
              >
                {creating ? "Duke krijuar..." : "Krijo Kodin"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Kodi</th>
                <th className="px-4 py-3">Zbritja</th>
                <th className="px-4 py-3">Përdorimi</th>
                <th className="px-4 py-3">Skadon</th>
                <th className="px-4 py-3">Statusi</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Duke ngarkuar...</td></tr>
              ) : codes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Nuk ka kode promo</td></tr>
              ) : codes.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/50 transition hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-mono font-bold text-zinc-100">{p.code}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {p.discount_type === "percent" ? `${p.discount_value}%` : `€${p.discount_value.toFixed(2)}`}
                    {p.min_order > 0 && <span className="ml-1 text-xs text-zinc-500">(min €{p.min_order})</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    <span className="font-medium">{p.used_count}</span>
                    <span className="text-zinc-500">/{p.max_uses ?? "∞"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)} title={p.active ? "Aktiv" : "Joaktiv"}>
                      {p.active ? (
                        <ToggleRight className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-zinc-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(p.id)} className="text-zinc-500 transition hover:text-red-400">
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
