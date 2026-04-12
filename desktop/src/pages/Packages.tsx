import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  adminGetPackages,
  adminToggleVisible,
  adminToggleHighlight,
  adminUpdateCategory,
  adminUpdatePackage,
  adminDeletePackage,
  adminCreatePackage,
  adminAutoCategories,
  type EsimPackage,
  type PaginatedPackages,
} from "@/lib/api";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Pencil,
  Trash2,
  X,
  Save,
  Plus,
  Wand2,
  Filter,
  Loader2,
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Të gjitha" },
  { value: "balkans", label: "Ballkani" },
  { value: "europe", label: "Evropa" },
  { value: "asia", label: "Azia" },
  { value: "middle_east", label: "Lindja e Mesme" },
  { value: "africa", label: "Afrika" },
  { value: "americas", label: "Amerikat" },
  { value: "oceania", label: "Oqeania" },
  { value: "global", label: "Global" },
];

const CATEGORY_COLORS: Record<string, string> = {
  balkans: "bg-red-500/10 text-red-400",
  europe: "bg-blue-500/10 text-blue-400",
  asia: "bg-amber-500/10 text-amber-400",
  middle_east: "bg-orange-500/10 text-orange-400",
  africa: "bg-green-500/10 text-green-400",
  americas: "bg-purple-500/10 text-purple-400",
  oceania: "bg-cyan-500/10 text-cyan-400",
  global: "bg-zinc-500/10 text-zinc-400",
};

type VisibleFilter = "all" | "visible" | "hidden";

export default function Packages() {
  const { token } = useAuth();
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [visFilter, setVisFilter] = useState<VisibleFilter>("all");
  const [editPkg, setEditPkg] = useState<EsimPackage | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [autoMsg, setAutoMsg] = useState("");

  const fetchPkgs = useCallback(() => {
    if (!token) return;
    setLoading(true);
    const vis = visFilter === "visible" ? 1 : visFilter === "hidden" ? 0 : undefined;
    adminGetPackages(token, page, 50, search, vis as 0 | 1 | undefined, catFilter || undefined)
      .then((d: PaginatedPackages) => {
        setPackages(d.packages);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page, search, catFilter, visFilter]);

  useEffect(() => { fetchPkgs(); }, [fetchPkgs]);
  useEffect(() => { setPage(1); }, [search, catFilter, visFilter]);

  async function toggleVisible(pkg: EsimPackage) {
    if (!token) return;
    setSaving(pkg.id);
    try {
      const updated = await adminToggleVisible(token, pkg.id, !pkg.visible);
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? updated : p)));
    } catch {}
    setSaving(null);
  }

  async function toggleHighlight(pkg: EsimPackage) {
    if (!token) return;
    setSaving(pkg.id);
    try {
      const updated = await adminToggleHighlight(token, pkg.id, !pkg.highlight);
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? updated : p)));
    } catch {}
    setSaving(null);
  }

  async function changeCategory(pkg: EsimPackage, category: string) {
    if (!token) return;
    setSaving(pkg.id);
    try {
      const updated = await adminUpdateCategory(token, pkg.id, category);
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? updated : p)));
    } catch {}
    setSaving(null);
  }

  async function deletePkg(pkg: EsimPackage) {
    if (!token) return;
    if (!confirm(`Fshi "${pkg.name}"? Ky veprim nuk kthehet.`)) return;
    setSaving(pkg.id);
    try {
      await adminDeletePackage(token, pkg.id);
      setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
      setTotal((t) => t - 1);
    } catch {}
    setSaving(null);
  }

  async function autoCategorizePkgs() {
    if (!token) return;
    setAutoMsg("Duke kategorizuar...");
    try {
      const res = await adminAutoCategories(token);
      setAutoMsg(res.message);
      fetchPkgs();
    } catch {
      setAutoMsg("Gabim gjatë kategorizimit");
    }
    setTimeout(() => setAutoMsg(""), 4000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Paketat</h1>
          <p className="text-sm text-zinc-500">{total} gjithsej</p>
        </div>
        <div className="flex items-center gap-2">
          {autoMsg && <span className="text-xs text-green-400 animate-pulse">{autoMsg}</span>}
          <button onClick={autoCategorizePkgs} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition">
            <Wand2 className="h-3.5 w-3.5" /> Auto-kategorizo
          </button>
          <button onClick={() => { setCreateMode(true); setEditPkg(null); }} className="flex items-center gap-1.5 rounded-lg bg-shqiponja px-3 py-1.5 text-xs font-bold text-white hover:bg-shqiponja-dark transition">
            <Plus className="h-3.5 w-3.5" /> Shto paketë
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Kërko paketa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-2 text-sm outline-none focus:border-shqiponja transition" />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-zinc-500" />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-2 text-xs outline-none focus:border-shqiponja transition">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
          {(["all", "visible", "hidden"] as VisibleFilter[]).map((v) => (
            <button key={v} onClick={() => setVisFilter(v)} className={`px-3 py-1.5 text-xs transition ${visFilter === v ? "bg-shqiponja text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
              {v === "all" ? "Të gjitha" : v === "visible" ? "Aktive" : "Fshehura"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-3 py-3 font-medium w-10">#</th>
                <th className="px-3 py-3 font-medium w-10"></th>
                <th className="px-3 py-3 font-medium">Emri</th>
                <th className="px-3 py-3 font-medium w-20">Data</th>
                <th className="px-3 py-3 font-medium w-24">Kohëzgjatja</th>
                <th className="px-3 py-3 font-medium w-20">Çmimi</th>
                <th className="px-3 py-3 font-medium w-28">Kategoria</th>
                <th className="px-3 py-3 font-medium w-20 text-center">I dukshëm</th>
                <th className="px-3 py-3 font-medium w-20 text-center">Highlight</th>
                <th className="px-3 py-3 font-medium w-24 text-center">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {packages.map((p) => (
                <tr key={p.id} className={`transition ${p.visible === false ? "text-zinc-500 bg-zinc-900/50" : "text-zinc-300 hover:bg-zinc-800/50"}`}>
                  <td className="px-3 py-2.5 font-mono text-xs text-zinc-600">{p.id}</td>
                  <td className="px-3 py-2.5 text-lg">{p.flag}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-sm">{p.name}</div>
                    {p.airalo_package_id && <div className="font-mono text-[10px] text-zinc-600 mt-0.5">{p.airalo_package_id}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-xs">{p.data}</td>
                  <td className="px-3 py-2.5 text-xs">{p.duration}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">€{p.price.toFixed(2)}</td>
                  <td className="px-3 py-2.5">
                    <select value={p.category || ""} onChange={(e) => changeCategory(p, e.target.value)} disabled={saving === p.id}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border-0 outline-none cursor-pointer ${CATEGORY_COLORS[p.category || ""] || "bg-zinc-700/30 text-zinc-500"}`}>
                      {CATEGORIES.filter((c) => c.value).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => toggleVisible(p)} disabled={saving === p.id}
                      className={`inline-flex items-center justify-center rounded-lg p-1.5 transition ${p.visible !== false ? "text-green-400 hover:bg-green-500/10" : "text-zinc-600 hover:bg-zinc-700/50"}`}
                      title={p.visible !== false ? "Fshih" : "Shfaq"}>
                      {saving === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : p.visible !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => toggleHighlight(p)} disabled={saving === p.id}
                      className={`inline-flex items-center justify-center rounded-lg p-1.5 transition ${p.highlight ? "text-amber-400 hover:bg-amber-500/10" : "text-zinc-600 hover:bg-zinc-700/50"}`}
                      title={p.highlight ? "Hiq highlight" : "Vendos highlight"}>
                      {p.highlight ? <Star className="h-4 w-4 fill-amber-400" /> : <StarOff className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditPkg(p); setCreateMode(false); }} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200 transition" title="Redakto">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deletePkg(p)} disabled={saving === p.id} className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition" title="Fshi">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {packages.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Asnjë paketë</p>}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-xs text-zinc-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* Edit / Create Modal */}
      {(editPkg || createMode) && (
        <PackageModal
          pkg={createMode ? null : editPkg}
          token={token!}
          onClose={() => { setEditPkg(null); setCreateMode(false); }}
          onSaved={(updated) => {
            if (createMode) {
              setPackages((prev) => [updated, ...prev]);
              setTotal((t) => t + 1);
            } else {
              setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            }
            setEditPkg(null);
            setCreateMode(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Package Edit/Create Modal ─── */
function PackageModal({ pkg, token, onClose, onSaved }: {
  pkg: EsimPackage | null; token: string; onClose: () => void; onSaved: (p: EsimPackage) => void;
}) {
  const isNew = !pkg;
  const [form, setForm] = useState({
    name: pkg?.name || "", region: pkg?.region || "", flag: pkg?.flag || "",
    data: pkg?.data || "", duration: pkg?.duration || "", price: pkg?.price?.toString() || "",
    currency: pkg?.currency || "EUR", description: pkg?.description || "",
    category: pkg?.category || "europe", highlight: pkg?.highlight || false, visible: pkg?.visible !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string | boolean) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.name || !form.region || !form.flag || !form.data || !form.duration) { setError("Plotëso fushat e detyrueshme"); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError("Çmimi duhet të jetë numër pozitiv"); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, price };
      const result = isNew ? await adminCreatePackage(token, payload) : await adminUpdatePackage(token, pkg!.id, payload);
      onSaved(result);
    } catch (err) { setError(err instanceof Error ? err.message : "Gabim"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold">{isNew ? "Krijo paketë të re" : "Redakto paketën"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800"><X className="h-4 w-4" /></button>
        </div>
        {error && <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Emri *" value={form.name} onChange={(v) => set("name", v)} span={2} />
          <Field label="Rajoni *" value={form.region} onChange={(v) => set("region", v)} />
          <Field label="Flamuri *" value={form.flag} onChange={(v) => set("flag", v)} placeholder="🇦🇱" />
          <Field label="Data *" value={form.data} onChange={(v) => set("data", v)} placeholder="1 GB" />
          <Field label="Kohëzgjatja *" value={form.duration} onChange={(v) => set("duration", v)} placeholder="7 ditë" />
          <Field label="Çmimi (€) *" value={form.price} onChange={(v) => set("price", v)} type="number" />
          <Field label="Valuta" value={form.currency} onChange={(v) => set("currency", v)} />
          <Field label="Përshkrimi" value={form.description} onChange={(v) => set("description", v)} span={2} />
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Kategoria</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-shqiponja transition">
              {CATEGORIES.filter((c) => c.value).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} className="h-3.5 w-3.5 accent-shqiponja" />
              <span className="text-xs text-zinc-400">I dukshëm</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.highlight} onChange={(e) => set("highlight", e.target.checked)} className="h-3.5 w-3.5 accent-amber-400" />
              <span className="text-xs text-zinc-400">Highlight</span>
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-800 transition">Anulo</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-shqiponja px-4 py-2 text-xs font-bold text-white hover:bg-shqiponja-dark disabled:opacity-50 transition">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isNew ? "Krijo" : "Ruaj"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", span = 1 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-shqiponja transition" />
    </div>
  );
}
