"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import {
  adminGetUsers,
  adminUpdateUserRole,
  adminDeleteUser,
  adminSendMarketing,
  type User,
  type PaginatedUsers,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ChevronLeft, ChevronRight, Mail, MessageSquare, Send } from "lucide-react";

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // Marketing state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [marketingType, setMarketingType] = useState<"email" | "sms">("email");
  const [marketingSubject, setMarketingSubject] = useState("");
  const [marketingMessage, setMarketingMessage] = useState("");
  const [marketingSending, setMarketingSending] = useState(false);
  const [marketingResult, setMarketingResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    adminGetUsers(token, page, search)
      .then((data: PaginatedUsers) => {
        if (cancelled) return;
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, page, search]);

  async function toggleRole(u: User) {
    if (!token) return;
    const newRole = u.role === "admin" ? "customer" : "admin";
    try {
      const updated = await adminUpdateUserRole(token, u.id, newRole);
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast(`${u.name} → ${newRole}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  async function handleDelete(u: User) {
    if (!token) return;
    if (!confirm(`${t("admin.confirmDelete")} ${u.name}?`)) return;
    try {
      await adminDeleteUser(token, u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast(`${u.name} ${t("admin.delete").toLowerCase()}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  }

  async function handleSendMarketing() {
    if (!token) return;
    if (!marketingMessage.trim()) {
      toast(t("admin.marketingMessage") + " nevojitet", "error");
      return;
    }
    if (marketingType === "email" && !marketingSubject.trim()) {
      toast(t("admin.marketingSubject") + " nevojitet", "error");
      return;
    }
    setMarketingSending(true);
    setMarketingResult(null);
    try {
      const userIds = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
      const result = await adminSendMarketing(token, {
        type: marketingType,
        subject: marketingSubject,
        message: marketingMessage,
        userIds,
      });
      setMarketingResult(result);
      toast(
        t("admin.marketingResult")
          .replace("{sent}", String(result.sent))
          .replace("{failed}", String(result.failed)),
        result.failed === 0 ? "success" : "error"
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setMarketingSending(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-200" />
        ))}
      </div>
    );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-extrabold">{t("admin.users")}</h1>
      <p className="mt-1 text-sm text-zinc-500">{total} {t("admin.totalSuffix")}</p>

      <input
        type="text"
        placeholder={t("admin.search")}
        value={search}
        onChange={(e) => {
          setLoading(true);
          setPage(1);
          setSearch(e.target.value);
        }}
        className="mt-4 w-full sm:max-w-xs rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800"
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedIds.size === users.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded accent-shqiponja"
                />
              </th>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">{t("admin.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.email")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.phone")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.role")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.registered")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {users.map((u) => (
              <tr
                key={u.id}
                className={`hover:bg-zinc-50 transition dark:hover:bg-zinc-800 ${selectedIds.has(u.id) ? "bg-shqiponja/5 dark:bg-shqiponja/10" : ""}`}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggleSelect(u.id)}
                    className="h-4 w-4 rounded accent-shqiponja"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{u.id}</td>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 text-zinc-500">{u.phone || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-shqiponja/10 text-shqiponja"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {u.role === "admin" ? t("admin.admin") : t("admin.customer")}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(u.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US")}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => toggleRole(u)}
                    disabled={u.id === me?.id}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"
                  >
                    {u.role === "admin" ? t("admin.makeCustomer") : t("admin.makeAdmin")}
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={u.id === me?.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-40 dark:border-red-800 dark:hover:bg-red-900/30"
                  >
                    {t("admin.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => {
            setLoading(true);
            setPage(p => Math.max(1, p - 1));
          }} disabled={page === 1}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-zinc-500">{t("admin.page")} {page} / {totalPages}</span>
          <button onClick={() => {
            setLoading(true);
            setPage(p => Math.min(totalPages, p + 1));
          }} disabled={page === totalPages}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 transition disabled:opacity-40 dark:border-zinc-600 dark:hover:bg-zinc-700"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* ─── MARKETING PANEL ─── */}
      <div className="mt-10">
        <h2 className="text-lg font-extrabold flex items-center gap-2">
          <Send className="h-5 w-5 text-shqiponja" />
          {t("admin.marketing")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {selectedIds.size > 0
            ? `${selectedIds.size} ${t("admin.marketingSelected")}`
            : t("admin.marketingAll")}
        </p>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setMarketingType("email")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition border ${
                marketingType === "email"
                  ? "border-shqiponja bg-shqiponja text-white"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              }`}
            >
              <Mail className="h-4 w-4" />
              {t("admin.marketingEmail")}
            </button>
            <button
              onClick={() => setMarketingType("sms")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition border ${
                marketingType === "sms"
                  ? "border-shqiponja bg-shqiponja text-white"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              {t("admin.marketingSms")}
            </button>
          </div>

          {/* Subject (email only) */}
          {marketingType === "email" && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("admin.marketingSubject")}</label>
              <input
                type="text"
                value={marketingSubject}
                onChange={(e) => setMarketingSubject(e.target.value)}
                placeholder="p.sh. Ofertë ekskluzive për ju"
                maxLength={200}
                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("admin.marketingMessage")}
              {marketingType === "sms" && (
                <span className="ml-2 text-xs text-zinc-400">({marketingMessage.length}/1600)</span>
              )}
            </label>
            <textarea
              value={marketingMessage}
              onChange={(e) => setMarketingMessage(e.target.value)}
              rows={4}
              maxLength={1600}
              placeholder={
                marketingType === "email"
                  ? "Shkruani mesazhin tuaj të marketingut..."
                  : "Shkruani SMS-in tuaj (max 160 karaktere për SMS të vetme)..."
              }
              className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-shqiponja dark:border-zinc-700 dark:bg-zinc-800 resize-y"
            />
          </div>

          {/* Send button + result */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSendMarketing}
              disabled={marketingSending}
              className="flex items-center gap-2 rounded-lg bg-shqiponja px-5 py-2.5 text-sm font-semibold text-white hover:bg-shqiponja/90 transition disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {marketingSending ? t("admin.marketingSending") : t("admin.marketingSend")}
            </button>

            {marketingResult && (
              <span className={`text-sm font-medium ${marketingResult.failed > 0 ? "text-amber-600" : "text-green-600"}`}>
                ✓ {t("admin.marketingResult")
                  .replace("{sent}", String(marketingResult.sent))
                  .replace("{failed}", String(marketingResult.failed))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
